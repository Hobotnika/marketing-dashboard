import { NextResponse } from 'next/server';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { dailyRoutines } from '@/lib/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

/**
 * GET /api/business/congruence/routines
 * Fetch daily routines for the CURRENT USER ONLY (user-private)
 *
 * Query params:
 * - days: number (default: 30) - how many days to fetch
 *
 * Security: USER-PRIVATE - only returns this user's routines
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    console.log('[Routines] Fetching for user:', context.userId);
    console.log('[Routines] Date range:', startDateStr, 'to today');

    // CRITICAL: Filter by BOTH organizationId AND userId for privacy
    const routines = await db
      .select()
      .from(dailyRoutines)
      .where(
        and(
          eq(dailyRoutines.organizationId, context.organizationId),
          eq(dailyRoutines.userId, context.userId), // USER-PRIVATE!
          gte(dailyRoutines.date, startDateStr)
        )
      )
      .orderBy(desc(dailyRoutines.date))
      .limit(days);

    console.log('[Routines] Found', routines.length, 'routines');

    return NextResponse.json({
      success: true,
      routines,
    });
  } catch (error) {
    console.error('[Routines] Error fetching:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch routines',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/business/congruence/routines
 * Create or update a daily routine for the current user
 *
 * Security: USER-PRIVATE - creates/updates for current user only
 */
export const POST = withTenantSecurity(async (request: Request, context) => {
  try {
    const body = await request.json();
    const { date, ...routineData } = body;

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date is required' },
        { status: 400 }
      );
    }

    console.log('[Routines] Saving for user:', context.userId, 'date:', date);

    // Calculate completion rate
    const completedItems = [
      routineData.exerciseCompleted,
      routineData.gratitudeCompleted,
      routineData.meditationCompleted,
      routineData.breathworkCompleted,
    ].filter(Boolean).length;

    const completionRate = Math.round((completedItems / 4) * 100);

    // Check if entry exists for this user and date
    const existing = await db
      .select()
      .from(dailyRoutines)
      .where(
        and(
          eq(dailyRoutines.organizationId, context.organizationId),
          eq(dailyRoutines.userId, context.userId),
          eq(dailyRoutines.date, date)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing routine
      const updated = await db
        .update(dailyRoutines)
        .set({
          ...routineData,
          completionRate,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(dailyRoutines.id, existing[0].id))
        .returning();

      console.log('[Routines] Updated routine:', updated[0].id);

      return NextResponse.json({
        success: true,
        routine: updated[0],
      });
    } else {
      // Create new routine
      const created = await db
        .insert(dailyRoutines)
        .values({
          organizationId: context.organizationId,
          userId: context.userId,
          isPrivate: true,
          date,
          ...routineData,
          completionRate,
        })
        .returning();

      console.log('[Routines] Created routine:', created[0].id);

      return NextResponse.json({
        success: true,
        routine: created[0],
      });
    }
  } catch (error) {
    console.error('[Routines] Error saving:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save routine',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

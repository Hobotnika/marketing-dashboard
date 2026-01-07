import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { silentTimeBlocks } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

/**
 * GET /api/business/planning/silent-time
 * List silent time blocks for the current user (user-private)
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), week (YYYY-WXX)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const week = searchParams.get('week'); // e.g., "2025-W01"

    // Build query conditions (user-private: filter by both org and user)
    let conditions = [
      eq(silentTimeBlocks.organizationId, context.organizationId),
      eq(silentTimeBlocks.userId, context.userId),
    ];

    if (startDate && endDate) {
      conditions.push(gte(silentTimeBlocks.date, startDate));
      conditions.push(lte(silentTimeBlocks.date, endDate));
    }

    const blocks = await db
      .select()
      .from(silentTimeBlocks)
      .where(sql`${sql.join(conditions, sql` AND `)}`)
      .orderBy(desc(silentTimeBlocks.date), desc(silentTimeBlocks.startTime));

    // Calculate weekly summary if requested
    let weeklySummary = null;
    if (week || (startDate && endDate)) {
      const blocksOver90 = blocks.filter(b => b.durationMinutes && b.durationMinutes >= 90);
      const totalBlocks = blocks.length;
      const totalMinutes = blocks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
      const avgDuration = totalBlocks > 0 ? (totalMinutes / totalBlocks).toFixed(0) : '0';

      weeklySummary = {
        totalBlocks,
        blocksOver90: blocksOver90.length,
        totalMinutes,
        avgDuration,
        goalProgress: `${blocksOver90.length}/3`, // Goal: 2-3 blocks of 90+ min per week
      };
    }

    return NextResponse.json({
      success: true,
      blocks,
      weeklySummary,
    });
  } catch (error) {
    console.error('Error fetching silent time blocks:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch silent time blocks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/planning/silent-time
 * Log a new silent time block (user-private)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const {
      date,
      startTime,
      endTime,
      durationMinutes,
      focusArea,
      taskCompleted,
      distractions,
      notes,
    } = body;

    // Validation
    if (!date || !startTime || !durationMinutes) {
      return NextResponse.json(
        { error: 'Date, start time, and duration are required' },
        { status: 400 }
      );
    }

    const newBlock = await db
      .insert(silentTimeBlocks)
      .values({
        organizationId: context.organizationId,
        userId: context.userId, // User-private
        date,
        startTime,
        endTime: endTime || null,
        durationMinutes,
        focusArea: focusArea || null,
        taskCompleted: taskCompleted || null,
        distractions: distractions || null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      block: newBlock[0],
    });
  } catch (error) {
    console.error('Error creating silent time block:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create silent time block' },
      { status: 500 }
    );
  }
}

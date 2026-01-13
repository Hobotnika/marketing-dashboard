import { NextResponse } from 'next/server';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { incomeActivities } from '@/lib/db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

/**
 * GET /api/business/financial/income
 * Fetch income activities for the organization
 *
 * Query params:
 * - days: number (default: 30) - how many days to fetch
 * - source: string (optional) - filter by income source
 *
 * Security: Protected by withTenantSecurity
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const sourceFilter = searchParams.get('source');

    // Calculate date range (YYYY-MM-DD format for SQLite)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    console.log('[Financial/Income] Fetching for org:', context.workspaceId);
    console.log('[Financial/Income] Date range:', startDateStr, 'to today');
    if (sourceFilter) {
      console.log('[Financial/Income] Source filter:', sourceFilter);
    }

    // Build query conditions
    const conditions = [
      eq(incomeActivities.workspaceId, context.workspaceId),
      gte(incomeActivities.date, startDateStr)
    ];

    if (sourceFilter && ['content_ads', 'messages_dms', 'strategy_calls', 'other'].includes(sourceFilter)) {
      conditions.push(eq(incomeActivities.source, sourceFilter));
    }

    // Fetch income activities
    const activities = await db
      .select()
      .from(incomeActivities)
      .where(and(...conditions))
      .orderBy(desc(incomeActivities.date));

    // Calculate totals by source
    const totalBySource = await db
      .select({
        source: incomeActivities.source,
        total: sql<number>`CAST(SUM(COALESCE(${incomeActivities.amount}, 0)) AS INTEGER)`,
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(incomeActivities)
      .where(and(...conditions))
      .groupBy(incomeActivities.source);

    console.log('[Financial/Income] Found', activities.length, 'activities');

    return NextResponse.json({
      success: true,
      activities,
      totals: totalBySource,
      count: activities.length,
      period: { days, start: startDateStr, end: new Date().toISOString().split('T')[0] },
    });
  } catch (error) {
    console.error('[Financial/Income] Error fetching:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch income activities',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/business/financial/income
 * Add income activity
 *
 * Body:
 * - date: string (YYYY-MM-DD)
 * - source: string (enum: content_ads, messages_dms, strategy_calls, other)
 * - description: string (optional)
 * - amount: number (cents)
 * - kpisStage: string (optional)
 *
 * Security: Protected by withTenantSecurity
 */
export const POST = withTenantSecurity(async (request: Request, context) => {
  try {
    const body = await request.json();
    const { date, source, description, amount, kpisStage } = body;

    // Validation
    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date is required (YYYY-MM-DD format)' },
        { status: 400 }
      );
    }

    if (!source) {
      return NextResponse.json(
        { success: false, error: 'Source is required' },
        { status: 400 }
      );
    }

    const validSources = ['content_ads', 'messages_dms', 'strategy_calls', 'other'];
    if (!validSources.includes(source)) {
      return NextResponse.json(
        { success: false, error: `Invalid source. Must be one of: ${validSources.join(', ')}` },
        { status: 400 }
      );
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount < 0)) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a non-negative number (in cents)' },
        { status: 400 }
      );
    }

    console.log('[Financial/Income] Creating for date:', date);
    console.log('[Financial/Income] Organization:', context.workspaceId);
    console.log('[Financial/Income] User:', context.userId);
    console.log('[Financial/Income] Source:', source, 'Amount:', amount);

    // Create new income activity
    const [newActivity] = await db
      .insert(incomeActivities)
      .values({
        workspaceId: context.workspaceId,
        userId: context.userId,
        date,
        source,
        description: description || null,
        amount: amount || null,
        kpisStage: kpisStage || null,
      })
      .returning();

    console.log('[Financial/Income] ✅ Created successfully');

    return NextResponse.json({
      success: true,
      activity: newActivity,
      message: 'Income activity created successfully',
    });
  } catch (error) {
    console.error('[Financial/Income] Error creating:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create income activity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/business/financial/income
 * Delete an income activity
 *
 * Query params:
 * - id: string (required) - ID of income activity to delete
 *
 * Security: Protected by withTenantSecurity
 */
export const DELETE = withTenantSecurity(async (request: Request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    console.log('[Financial/Income] Deleting ID:', id);
    console.log('[Financial/Income] Organization:', context.workspaceId);

    // Delete activity (with organization check for security)
    const result = await db
      .delete(incomeActivities)
      .where(
        and(
          eq(incomeActivities.id, id),
          eq(incomeActivities.workspaceId, context.workspaceId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Income activity not found or access denied' },
        { status: 404 }
      );
    }

    console.log('[Financial/Income] ✅ Deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Income activity deleted successfully',
    });
  } catch (error) {
    console.error('[Financial/Income] Error deleting:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete income activity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { executionLogs, monthlyActivities } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

/**
 * GET /api/business/execution/logs
 * Fetch execution logs with optional date range (USER-PRIVATE)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD format
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereConditions = [eq(executionLogs.userId, context.userId)];

    if (date) {
      // Single day
      whereConditions.push(eq(executionLogs.date, date));
    } else if (startDate && endDate) {
      // Date range
      whereConditions.push(
        and(
          gte(executionLogs.date, startDate),
          lte(executionLogs.date, endDate)
        )!
      );
    }

    const logs = await db
      .select()
      .from(executionLogs)
      .where(and(...whereConditions))
      .orderBy(desc(executionLogs.completedAt));

    // Calculate summary stats
    const summary = {
      totalLogs: logs.length,
      planned: logs.filter((l) => l.wasPlanned).length,
      unplanned: logs.filter((l) => !l.wasPlanned).length,
      totalTime: logs.reduce((sum, l) => sum + (l.actualDurationMinutes || 0), 0),
      byType: {
        income: logs.filter((l) => l.activityType === 'income').length,
        affiliate: logs.filter((l) => l.activityType === 'affiliate').length,
        other: logs.filter((l) => l.activityType === 'other').length,
      },
    };

    return NextResponse.json({ success: true, logs, summary });
  } catch (error) {
    console.error('Error fetching execution logs:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch execution logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/execution/logs
 * Log execution (USER-PRIVATE)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const {
      date,
      activityTitle,
      activityType,
      plannedActivityId,
      wasPlanned,
      plannedDurationMinutes,
      actualDurationMinutes,
      notes,
      outcome,
    } = body;

    // Validation
    if (!activityTitle) {
      return NextResponse.json(
        { success: false, error: 'Activity title is required' },
        { status: 400 }
      );
    }

    // If linked to planned activity, mark it as completed
    if (plannedActivityId) {
      await db
        .update(monthlyActivities)
        .set({
          isCompleted: true,
          completedAt: new Date().toISOString(),
          actualOutcome: outcome || null,
        })
        .where(
          and(
            eq(monthlyActivities.id, plannedActivityId),
            eq(monthlyActivities.userId, context.userId)
          )
        );
    }

    const newLog = await db
      .insert(executionLogs)
      .values({
        organizationId: context.organizationId,
        userId: context.userId,
        date: date || new Date().toISOString().split('T')[0],
        activityTitle,
        activityType: activityType || null,
        plannedActivityId: plannedActivityId || null,
        wasPlanned: wasPlanned || false,
        plannedDurationMinutes: plannedDurationMinutes || null,
        actualDurationMinutes: actualDurationMinutes || null,
        notes: notes || null,
        outcome: outcome || null,
      })
      .returning();

    return NextResponse.json({ success: true, log: newLog[0] }, { status: 201 });
  } catch (error) {
    console.error('Error logging execution:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to log execution' },
      { status: 500 }
    );
  }
}

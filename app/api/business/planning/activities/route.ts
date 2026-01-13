import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { monthlyActivities } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

/**
 * GET /api/business/planning/activities
 * List monthly activities for the current user (user-private)
 * Query params: month (YYYY-MM), startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), type (income/affiliate/other)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM
    const startDate = searchParams.get('startDate'); // YYYY-MM-DD
    const endDate = searchParams.get('endDate'); // YYYY-MM-DD
    const type = searchParams.get('type'); // income, affiliate, other

    // Build query conditions (user-private: filter by both org and user)
    let conditions = [
      eq(monthlyActivities.workspaceId, context.workspaceId),
      eq(monthlyActivities.userId, context.userId),
    ];

    // Filter by month or date range
    if (month) {
      const monthStart = `${month}-01`;
      const monthEnd = `${month}-31`;
      conditions.push(gte(monthlyActivities.date, monthStart));
      conditions.push(lte(monthlyActivities.date, monthEnd));
    } else if (startDate && endDate) {
      conditions.push(gte(monthlyActivities.date, startDate));
      conditions.push(lte(monthlyActivities.date, endDate));
    }

    // Filter by activity type
    if (type && type !== 'all') {
      conditions.push(eq(monthlyActivities.activityType, type));
    }

    const activities = await db
      .select()
      .from(monthlyActivities)
      .where(sql`${sql.join(conditions, sql` AND `)}`)
      .orderBy(desc(monthlyActivities.date));

    return NextResponse.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error('Error fetching monthly activities:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/planning/activities
 * Create a new monthly activity (user-private)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const {
      date,
      title,
      activityType,
      category,
      timeSlot,
      durationMinutes,
      description,
      clientId,
    } = body;

    // Validation
    if (!date || !title || !activityType) {
      return NextResponse.json(
        { error: 'Date, title, and activity type are required' },
        { status: 400 }
      );
    }

    if (!['income', 'affiliate', 'other'].includes(activityType)) {
      return NextResponse.json(
        { error: 'Activity type must be income, affiliate, or other' },
        { status: 400 }
      );
    }

    const newActivity = await db
      .insert(monthlyActivities)
      .values({
        workspaceId: context.workspaceId,
        userId: context.userId, // User-private
        date,
        title,
        activityType,
        category: category || null,
        timeSlot: timeSlot || null,
        durationMinutes: durationMinutes || null,
        description: description || null,
        clientId: clientId || null,
        isCompleted: false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      activity: newActivity[0],
    });
  } catch (error) {
    console.error('Error creating activity:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}

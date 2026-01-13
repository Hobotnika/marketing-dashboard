import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { weeklyReviews, transactions, clients, monthlyActivities } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

/**
 * GET /api/business/planning/reviews
 * List weekly reviews for the current user (user-private)
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query conditions (user-private: filter by both org and user)
    let conditions = [
      eq(weeklyReviews.workspaceId, context.workspaceId),
      eq(weeklyReviews.userId, context.userId),
    ];

    if (startDate) {
      conditions.push(gte(weeklyReviews.weekStartDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(weeklyReviews.weekStartDate, endDate));
    }

    const reviews = await db
      .select()
      .from(weeklyReviews)
      .where(sql`${sql.join(conditions, sql` AND `)}`)
      .orderBy(desc(weeklyReviews.weekStartDate));

    return NextResponse.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error('Error fetching weekly reviews:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/planning/reviews
 * Create a new weekly review with auto-populated metrics (user-private)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const {
      weekStartDate,
      weekEndDate,
      // User inputs
      bigWin,
      challengeFaced,
      lessonLearned,
      gratefulFor,
      nextWeekFocus,
      energyLevel,
      progressRating,
    } = body;

    // Validation
    if (!weekStartDate || !weekEndDate) {
      return NextResponse.json(
        { error: 'Week start and end dates are required' },
        { status: 400 }
      );
    }

    // Auto-populate metrics from other sections

    // 1. Revenue from transactions (Financial Command Center)
    const revenueData = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.workspaceId, context.workspaceId),
          eq(transactions.type, 'income'),
          gte(transactions.date, weekStartDate),
          lte(transactions.date, weekEndDate)
        )
      );

    const weeklyRevenue = revenueData
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)
      .toFixed(2);

    // 2. New clients from Client Success Hub
    const newClientsData = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.workspaceId, context.workspaceId),
          gte(clients.createdAt, weekStartDate),
          lte(clients.createdAt, weekEndDate)
        )
      );

    const newClientsCount = newClientsData.length;

    // 3. Completed activities from Monthly Activities (user-private)
    const completedActivitiesData = await db
      .select()
      .from(monthlyActivities)
      .where(
        and(
          eq(monthlyActivities.workspaceId, context.workspaceId),
          eq(monthlyActivities.userId, context.userId),
          eq(monthlyActivities.isCompleted, true),
          gte(monthlyActivities.date, weekStartDate),
          lte(monthlyActivities.date, weekEndDate)
        )
      );

    const completedActivitiesCount = completedActivitiesData.length;

    // Create weekly review
    const newReview = await db
      .insert(weeklyReviews)
      .values({
        workspaceId: context.workspaceId,
        userId: context.userId, // User-private
        weekStartDate,
        weekEndDate,
        weeklyRevenue,
        newClientsCount,
        completedActivitiesCount,
        bigWin: bigWin || null,
        challengeFaced: challengeFaced || null,
        lessonLearned: lessonLearned || null,
        gratefulFor: gratefulFor || null,
        nextWeekFocus: nextWeekFocus || null,
        energyLevel: energyLevel || null,
        progressRating: progressRating || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      review: newReview[0],
      autoPopulatedMetrics: {
        weeklyRevenue,
        newClientsCount,
        completedActivitiesCount,
      },
    });
  } catch (error) {
    console.error('Error creating weekly review:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

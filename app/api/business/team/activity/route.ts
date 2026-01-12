import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { activityFeed, users } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * GET /api/business/team/activity
 * Fetch activity feed with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const activityType = searchParams.get('activityType'); // filter by type
    const userId = searchParams.get('userId'); // filter by user
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let conditions = [eq(activityFeed.organizationId, context.organizationId)];

    if (activityType && activityType !== 'all') {
      conditions.push(eq(activityFeed.activityType, activityType));
    }

    if (userId && userId !== 'all') {
      conditions.push(eq(activityFeed.userId, userId));
    }

    // Fetch activities with user info
    const activities = await db
      .select({
        id: activityFeed.id,
        activityType: activityFeed.activityType,
        entityType: activityFeed.entityType,
        entityId: activityFeed.entityId,
        activityText: activityFeed.activityText,
        metadata: activityFeed.metadata,
        createdAt: activityFeed.createdAt,
        userId: activityFeed.userId,
        userName: users.name,
      })
      .from(activityFeed)
      .leftJoin(users, eq(activityFeed.userId, users.id))
      .where(sql`${sql.join(conditions, sql` AND `)}`)
      .orderBy(desc(activityFeed.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      activities,
      pagination: {
        limit,
        offset,
        hasMore: activities.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}

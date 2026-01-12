import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/business/team/notifications
 * Fetch user's notifications
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let conditions = [
      eq(notifications.userId, context.userId),
      eq(notifications.organizationId, context.organizationId),
    ];

    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const notificationList = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    // Count unread
    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, context.userId),
          eq(notifications.organizationId, context.organizationId),
          eq(notifications.isRead, false)
        )
      );

    return NextResponse.json({
      success: true,
      notifications: notificationList,
      unreadCount: unreadNotifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/team/notifications
 * Mark notification(s) as read
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all unread notifications as read
      await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(notifications.userId, context.userId),
            eq(notifications.organizationId, context.organizationId),
            eq(notifications.isRead, false)
          )
        );

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } else if (notificationId) {
      // Mark single notification as read
      const updatedNotifications = await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, context.userId),
            eq(notifications.organizationId, context.organizationId)
          )
        )
        .returning();

      if (updatedNotifications.length === 0) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        notification: updatedNotifications[0],
      });
    } else {
      return NextResponse.json(
        { error: 'Either notificationId or markAllAsRead must be provided' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating notifications:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

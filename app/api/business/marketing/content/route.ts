import { NextResponse } from 'next/server';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { contentCalendar } from '@/lib/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

/**
 * GET /api/business/marketing/content
 * List content items for the organization
 *
 * Query params:
 * - platform: string (optional) - filter by platform (email, linkedin, instagram, facebook)
 * - status: string (optional) - filter by status (idea, drafted, scheduled, published)
 * - days: number (optional, default: 90) - how many days to fetch
 *
 * Security: Protected by withTenantSecurity
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const platformFilter = searchParams.get('platform');
    const statusFilter = searchParams.get('status');
    const days = parseInt(searchParams.get('days') || '90');

    console.log('[Marketing/Content] Fetching for org:', context.workspaceId);
    if (platformFilter) console.log('[Marketing/Content] Platform filter:', platformFilter);
    if (statusFilter) console.log('[Marketing/Content] Status filter:', statusFilter);

    // Calculate date range (fetch content from X days ago)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Build query conditions
    const conditions = [
      eq(contentCalendar.workspaceId, context.workspaceId),
      gte(contentCalendar.scheduledDate, startDateStr),
    ];

    if (platformFilter && ['email', 'linkedin', 'instagram', 'facebook'].includes(platformFilter)) {
      conditions.push(eq(contentCalendar.platform, platformFilter as any));
    }

    if (statusFilter && ['idea', 'drafted', 'scheduled', 'published'].includes(statusFilter)) {
      conditions.push(eq(contentCalendar.status, statusFilter as any));
    }

    // Fetch content items
    const contentList = await db
      .select()
      .from(contentCalendar)
      .where(and(...conditions))
      .orderBy(desc(contentCalendar.scheduledDate));

    console.log('[Marketing/Content] Found', contentList.length, 'content items');

    return NextResponse.json({
      success: true,
      content: contentList,
      count: contentList.length,
    });
  } catch (error) {
    console.error('[Marketing/Content] Error fetching:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch content',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/business/marketing/content
 * Create a new content item
 *
 * Body:
 * - platform: string (required) - email, linkedin, instagram, facebook
 * - scheduledDate: string (required) - YYYY-MM-DD
 * - contentType: string (required) - post, story, email, article, video
 * - title: string (required)
 * - body: string (optional)
 * - notes: string (optional)
 * - status: string (optional, defaults to 'idea')
 *
 * Security: Protected by withTenantSecurity
 */
export const POST = withTenantSecurity(async (request: Request, context) => {
  try {
    const body = await request.json();
    const {
      platform,
      scheduledDate,
      contentType,
      title,
      body: contentBody,
      notes,
      status,
    } = body;

    // Validation
    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform is required' },
        { status: 400 }
      );
    }

    const validPlatforms = ['email', 'linkedin', 'instagram', 'facebook'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { success: false, error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    if (!scheduledDate) {
      return NextResponse.json(
        { success: false, error: 'Scheduled date is required (YYYY-MM-DD format)' },
        { status: 400 }
      );
    }

    if (!contentType) {
      return NextResponse.json(
        { success: false, error: 'Content type is required' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['idea', 'drafted', 'scheduled', 'published'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('[Marketing/Content] Creating for org:', context.workspaceId);
    console.log('[Marketing/Content] Platform:', platform, 'Date:', scheduledDate);

    // Create content item
    const [newContent] = await db
      .insert(contentCalendar)
      .values({
        workspaceId: context.workspaceId,
        userId: context.userId,
        platform,
        scheduledDate,
        contentType,
        title,
        body: contentBody || null,
        notes: notes || null,
        status: status || 'idea',
      })
      .returning();

    console.log('[Marketing/Content] ✅ Created successfully');

    return NextResponse.json({
      success: true,
      content: newContent,
      message: 'Content item created successfully',
    });
  } catch (error) {
    console.error('[Marketing/Content] Error creating:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create content item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/business/marketing/content
 * Update a content item (typically status change)
 *
 * Query params:
 * - id: string (required) - ID of content to update
 *
 * Body:
 * - status: string (optional) - idea, drafted, scheduled, published
 * - title: string (optional)
 * - body: string (optional)
 * - notes: string (optional)
 * - scheduledDate: string (optional)
 *
 * Security: Protected by withTenantSecurity
 */
export const PATCH = withTenantSecurity(async (request: Request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, title, body: contentBody, notes, scheduledDate } = body;

    console.log('[Marketing/Content] Updating ID:', id);
    console.log('[Marketing/Content] Organization:', context.workspaceId);

    // Prepare update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (status) {
      const validStatuses = ['idea', 'drafted', 'scheduled', 'published'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = status;

      // Set publishedAt when status changes to 'published'
      if (status === 'published') {
        updateData.publishedAt = new Date().toISOString();
      }
    }

    if (title !== undefined) updateData.title = title;
    if (contentBody !== undefined) updateData.body = contentBody;
    if (notes !== undefined) updateData.notes = notes;
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate;

    // Update content item (with organization check for security)
    const result = await db
      .update(contentCalendar)
      .set(updateData)
      .where(
        and(
          eq(contentCalendar.id, id),
          eq(contentCalendar.workspaceId, context.workspaceId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content item not found or access denied' },
        { status: 404 }
      );
    }

    console.log('[Marketing/Content] ✅ Updated successfully');

    return NextResponse.json({
      success: true,
      content: result[0],
      message: 'Content item updated successfully',
    });
  } catch (error) {
    console.error('[Marketing/Content] Error updating:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update content item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/business/marketing/content
 * Delete a content item
 *
 * Query params:
 * - id: string (required) - ID of content to delete
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

    console.log('[Marketing/Content] Deleting ID:', id);
    console.log('[Marketing/Content] Organization:', context.workspaceId);

    // Delete content item (with organization check for security)
    const result = await db
      .delete(contentCalendar)
      .where(
        and(
          eq(contentCalendar.id, id),
          eq(contentCalendar.workspaceId, context.workspaceId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content item not found or access denied' },
        { status: 404 }
      );
    }

    console.log('[Marketing/Content] ✅ Deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Content item deleted successfully',
    });
  } catch (error) {
    console.error('[Marketing/Content] Error deleting:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete content item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

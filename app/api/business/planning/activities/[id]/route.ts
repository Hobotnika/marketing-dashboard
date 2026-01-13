import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { monthlyActivities } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PATCH /api/business/planning/activities/[id]
 * Update a monthly activity (user-private)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const activityId = params.id;

    const body = await request.json();
    const {
      title,
      activityType,
      category,
      timeSlot,
      durationMinutes,
      description,
      isCompleted,
      completedAt,
      actualOutcome,
      clientId,
    } = body;

    // Verify ownership (user-private)
    const existing = await db
      .select()
      .from(monthlyActivities)
      .where(
        and(
          eq(monthlyActivities.id, activityId),
          eq(monthlyActivities.workspaceId, context.workspaceId),
          eq(monthlyActivities.userId, context.userId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Activity not found or access denied' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (activityType !== undefined) updateData.activityType = activityType;
    if (category !== undefined) updateData.category = category;
    if (timeSlot !== undefined) updateData.timeSlot = timeSlot;
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
    if (description !== undefined) updateData.description = description;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
    if (completedAt !== undefined) updateData.completedAt = completedAt;
    if (actualOutcome !== undefined) updateData.actualOutcome = actualOutcome;
    if (clientId !== undefined) updateData.clientId = clientId;

    const updated = await db
      .update(monthlyActivities)
      .set(updateData)
      .where(
        and(
          eq(monthlyActivities.id, activityId),
          eq(monthlyActivities.workspaceId, context.workspaceId),
          eq(monthlyActivities.userId, context.userId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      activity: updated[0],
    });
  } catch (error) {
    console.error('Error updating activity:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/planning/activities/[id]
 * Delete a monthly activity (user-private)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const activityId = params.id;

    // Verify ownership (user-private)
    const existing = await db
      .select()
      .from(monthlyActivities)
      .where(
        and(
          eq(monthlyActivities.id, activityId),
          eq(monthlyActivities.workspaceId, context.workspaceId),
          eq(monthlyActivities.userId, context.userId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Activity not found or access denied' },
        { status: 404 }
      );
    }

    await db
      .delete(monthlyActivities)
      .where(
        and(
          eq(monthlyActivities.id, activityId),
          eq(monthlyActivities.workspaceId, context.workspaceId),
          eq(monthlyActivities.userId, context.userId)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Activity deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting activity:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}

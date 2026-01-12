import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { tasks, comments, activityFeed, notifications } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/business/team/tasks/[id]
 * Fetch task with comments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();

    // Fetch task
    const taskList = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, params.id),
          eq(tasks.organizationId, context.organizationId)
        )
      )
      .limit(1);

    if (taskList.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Fetch comments for this task
    const taskComments = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.entityType, 'task'),
          eq(comments.entityId, params.id),
          eq(comments.organizationId, context.organizationId)
        )
      )
      .orderBy(desc(comments.createdAt));

    return NextResponse.json({
      success: true,
      task: taskList[0],
      comments: taskComments,
    });
  } catch (error) {
    console.error('Error fetching task:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/business/team/tasks/[id]
 * Update task (status, assignee, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const body = await request.json();

    // Verify task belongs to organization
    const existingTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, params.id),
          eq(tasks.organizationId, context.organizationId)
        )
      )
      .limit(1);

    if (existingTasks.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const existingTask = existingTasks[0];

    // Build update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'completed') {
        updateData.completedAt = new Date().toISOString();
      }
    }
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;
    if (body.actualTimeMinutes !== undefined) updateData.actualTimeMinutes = body.actualTimeMinutes;
    if (body.tags !== undefined) updateData.tags = body.tags;

    const updatedTasks = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, params.id))
      .returning();

    // Create activity feed entry
    let activityText = '';
    if (body.status === 'completed') {
      activityText = `completed task "${existingTask.title}"`;
    } else if (body.assignedTo && body.assignedTo !== existingTask.assignedTo) {
      activityText = `reassigned task "${existingTask.title}" to ${body.assignedTo}`;
    } else {
      activityText = `updated task "${existingTask.title}"`;
    }

    await db.insert(activityFeed).values({
      organizationId: context.organizationId,
      userId: context.userId,
      activityType: body.status === 'completed' ? 'task_completed' : 'task_updated',
      entityType: 'task',
      entityId: params.id,
      activityText,
      metadata: JSON.stringify(updateData),
    });

    // Create notification for new assignee if changed
    if (body.assignedTo && body.assignedTo !== existingTask.assignedTo && body.assignedTo !== context.userId) {
      await db.insert(notifications).values({
        organizationId: context.organizationId,
        userId: body.assignedTo,
        notificationType: 'task_assigned',
        title: 'Task reassigned to you',
        message: `You have been assigned the task: "${existingTask.title}"`,
        link: `/dashboard/team?taskId=${params.id}`,
        isRead: false,
      });
    }

    return NextResponse.json({
      success: true,
      task: updatedTasks[0],
    });
  } catch (error) {
    console.error('Error updating task:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/team/tasks/[id]
 * Remove task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();

    // Verify task belongs to organization
    const existingTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, params.id),
          eq(tasks.organizationId, context.organizationId)
        )
      )
      .limit(1);

    if (existingTasks.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Delete task (comments will cascade delete)
    await db.delete(tasks).where(eq(tasks.id, params.id));

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

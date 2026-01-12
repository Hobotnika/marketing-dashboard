import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { tasks, users, activityFeed, notifications } from '@/lib/db/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';

/**
 * GET /api/business/team/tasks
 * List tasks (with filters: assignedTo, createdBy, status, section, priority)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get('assignedTo'); // filter by assignee
    const createdBy = searchParams.get('createdBy'); // filter by creator
    const status = searchParams.get('status'); // filter by status
    const section = searchParams.get('section'); // filter by linked section
    const priority = searchParams.get('priority'); // filter by priority

    // Build query
    let conditions = [eq(tasks.organizationId, context.organizationId)];

    if (assignedTo && assignedTo !== 'all') {
      if (assignedTo === 'me') {
        conditions.push(eq(tasks.assignedTo, context.userId));
      } else {
        conditions.push(eq(tasks.assignedTo, assignedTo));
      }
    }

    if (createdBy && createdBy !== 'all') {
      if (createdBy === 'me') {
        conditions.push(eq(tasks.createdBy, context.userId));
      } else {
        conditions.push(eq(tasks.createdBy, createdBy));
      }
    }

    if (status && status !== 'all') {
      conditions.push(eq(tasks.status, status));
    }

    if (section && section !== 'all') {
      conditions.push(eq(tasks.linkedSection, section));
    }

    if (priority && priority !== 'all') {
      conditions.push(eq(tasks.priority, priority));
    }

    // Fetch tasks with user info
    const taskList = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        taskType: tasks.taskType,
        linkedEntityId: tasks.linkedEntityId,
        linkedSection: tasks.linkedSection,
        priority: tasks.priority,
        status: tasks.status,
        dueDate: tasks.dueDate,
        completedAt: tasks.completedAt,
        estimatedTimeMinutes: tasks.estimatedTimeMinutes,
        actualTimeMinutes: tasks.actualTimeMinutes,
        tags: tasks.tags,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        createdBy: tasks.createdBy,
        assignedTo: tasks.assignedTo,
        creatorName: sql<string>`creator.name`,
        assigneeName: sql<string>`assignee.name`,
      })
      .from(tasks)
      .leftJoin(sql`users as creator`, eq(tasks.createdBy, sql`creator.id`))
      .leftJoin(sql`users as assignee`, eq(tasks.assignedTo, sql`assignee.id`))
      .where(sql`${sql.join(conditions, sql` AND `)}`)
      .orderBy(desc(tasks.createdAt));

    // Calculate summary stats
    const totalTasks = taskList.length;
    const todoTasks = taskList.filter((t) => t.status === 'todo').length;
    const inProgressTasks = taskList.filter((t) => t.status === 'in_progress').length;
    const completedTasks = taskList.filter((t) => t.status === 'completed').length;
    const blockedTasks = taskList.filter((t) => t.status === 'blocked').length;
    const overdueTasks = taskList.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== 'completed' &&
        t.status !== 'cancelled'
    ).length;

    return NextResponse.json({
      success: true,
      tasks: taskList,
      summary: {
        totalTasks,
        todoTasks,
        inProgressTasks,
        completedTasks,
        blockedTasks,
        overdueTasks,
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/team/tasks
 * Create task
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const {
      title,
      description,
      taskType,
      linkedEntityId,
      linkedSection,
      assignedTo,
      priority,
      dueDate,
      estimatedTimeMinutes,
      tags,
    } = body;

    // Validation
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const newTasks = await db
      .insert(tasks)
      .values({
        organizationId: context.organizationId,
        createdBy: context.userId,
        assignedTo: assignedTo || null,
        title,
        description: description || null,
        taskType: taskType || 'custom',
        linkedEntityId: linkedEntityId || null,
        linkedSection: linkedSection || null,
        priority: priority || 'medium',
        status: 'todo',
        dueDate: dueDate || null,
        estimatedTimeMinutes: estimatedTimeMinutes || null,
        tags: tags || null,
      })
      .returning();

    const newTask = newTasks[0];

    // Create activity feed entry
    await db.insert(activityFeed).values({
      organizationId: context.organizationId,
      userId: context.userId,
      activityType: 'task_assigned',
      entityType: 'task',
      entityId: newTask.id,
      activityText: `${context.userId} created task "${title}"${assignedTo ? ` and assigned to ${assignedTo}` : ''}`,
      metadata: JSON.stringify({ taskId: newTask.id, priority, linkedSection }),
    });

    // Create notification for assignee if different from creator
    if (assignedTo && assignedTo !== context.userId) {
      await db.insert(notifications).values({
        organizationId: context.organizationId,
        userId: assignedTo,
        notificationType: 'task_assigned',
        title: 'New task assigned to you',
        message: `You have been assigned the task: "${title}"`,
        link: `/dashboard/team?taskId=${newTask.id}`,
        isRead: false,
      });
    }

    return NextResponse.json({
      success: true,
      task: newTask,
    });
  } catch (error) {
    console.error('Error creating task:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

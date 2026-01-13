import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { onboardingTasks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await protectTenantRoute();

    const tasks = await db.query.onboardingTasks.findMany({
      where: eq(onboardingTasks.clientId, params.id),
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const body = await request.json();

    const newTask = await db
      .insert(onboardingTasks)
      .values({
        clientId: params.id,
        workspaceId: context.workspaceId,
        ...body,
      })
      .returning();

    return NextResponse.json({ success: true, task: newTask[0] });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const context = await protectTenantRoute();
    const body = await request.json();
    const { id, isCompleted } = body;

    const updatedTask = await db
      .update(onboardingTasks)
      .set({
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null,
        completedBy: isCompleted ? context.userId : null,
      })
      .where(eq(onboardingTasks.id, id))
      .returning();

    return NextResponse.json({ success: true, task: updatedTask[0] });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

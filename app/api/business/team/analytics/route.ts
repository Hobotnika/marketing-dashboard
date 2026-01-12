import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { tasks, teamMembers, users, activityFeed, comments } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

/**
 * GET /api/business/team/analytics
 * Fetch team performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || '30'; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));
    const startDateStr = startDate.toISOString();

    // Fetch all team members
    const members = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        role: teamMembers.role,
        department: teamMembers.department,
        status: teamMembers.status,
        userName: users.name,
      })
      .from(teamMembers)
      .leftJoin(users, eq(teamMembers.userId, users.id))
      .where(
        and(
          eq(teamMembers.organizationId, context.organizationId),
          eq(teamMembers.status, 'active')
        )
      );

    // Fetch all tasks
    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.organizationId, context.organizationId));

    // Fetch tasks in date range
    const recentTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, context.organizationId),
          gte(tasks.createdAt, startDateStr)
        )
      );

    // Calculate metrics per team member
    const memberMetrics = members.map((member) => {
      const memberTasks = allTasks.filter((t) => t.assignedTo === member.userId);
      const memberRecentTasks = recentTasks.filter((t) => t.assignedTo === member.userId);

      const completedTasks = memberTasks.filter((t) => t.status === 'completed').length;
      const totalTasks = memberTasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const overdueTasks = memberTasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < new Date() &&
          t.status !== 'completed' &&
          t.status !== 'cancelled'
      ).length;

      const inProgressTasks = memberTasks.filter((t) => t.status === 'in_progress').length;

      return {
        userId: member.userId,
        userName: member.userName,
        role: member.role,
        department: member.department,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate: Math.round(completionRate),
        recentTaskCount: memberRecentTasks.length,
      };
    });

    // Team summary
    const totalTeamTasks = allTasks.length;
    const totalCompleted = allTasks.filter((t) => t.status === 'completed').length;
    const totalInProgress = allTasks.filter((t) => t.status === 'in_progress').length;
    const totalOverdue = allTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== 'completed' &&
        t.status !== 'cancelled'
    ).length;

    const avgCompletionRate =
      memberMetrics.length > 0
        ? memberMetrics.reduce((sum, m) => sum + m.completionRate, 0) / memberMetrics.length
        : 0;

    // Fetch activity counts
    const recentActivities = await db
      .select()
      .from(activityFeed)
      .where(
        and(
          eq(activityFeed.organizationId, context.organizationId),
          gte(activityFeed.createdAt, startDateStr)
        )
      );

    // Fetch comment counts
    const recentComments = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.organizationId, context.organizationId),
          gte(comments.createdAt, startDateStr)
        )
      );

    const commentsPerTask =
      totalTeamTasks > 0 ? (recentComments.length / totalTeamTasks).toFixed(1) : 0;

    // Section usage (tasks by linked section)
    const sectionUsage = allTasks.reduce((acc: any, task) => {
      if (task.linkedSection) {
        acc[task.linkedSection] = (acc[task.linkedSection] || 0) + 1;
      }
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      summary: {
        teamSize: members.length,
        totalTasks: totalTeamTasks,
        completedTasks: totalCompleted,
        inProgressTasks: totalInProgress,
        overdueTasks: totalOverdue,
        avgCompletionRate: Math.round(avgCompletionRate),
        recentActivities: recentActivities.length,
        recentComments: recentComments.length,
        commentsPerTask,
      },
      memberMetrics,
      sectionUsage,
      workloadDistribution: memberMetrics.map((m) => ({
        userName: m.userName,
        taskCount: m.totalTasks,
      })),
    });
  } catch (error) {
    console.error('Error fetching team analytics:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch team analytics' },
      { status: 500 }
    );
  }
}

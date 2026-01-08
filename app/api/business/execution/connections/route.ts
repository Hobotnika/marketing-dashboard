import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { newConnections, connectionGoals } from '@/lib/db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

/**
 * GET /api/business/execution/connections
 * Fetch connections with stats (USER-PRIVATE)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('stats') === 'true';

    // Fetch all connections for the user
    const connections = await db
      .select()
      .from(newConnections)
      .where(eq(newConnections.userId, context.userId))
      .orderBy(desc(newConnections.date));

    // Get or create connection goals
    let goals = await db.query.connectionGoals.findFirst({
      where: eq(connectionGoals.userId, context.userId),
    });

    if (!goals) {
      // Create default goals
      const newGoals = await db
        .insert(connectionGoals)
        .values({
          organizationId: context.organizationId,
          userId: context.userId,
          dailyGoal: 5,
          weeklyGoal: 25,
          monthlyGoal: 100,
        })
        .returning();
      goals = newGoals[0];
    }

    let stats = null;

    if (includeStats) {
      const today = new Date().toISOString().split('T')[0];

      // This week (last 7 days)
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // This month (last 30 days)
      const monthStart = new Date();
      monthStart.setDate(monthStart.getDate() - 30);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const todayConnections = connections.filter((c) => c.date === today);
      const weekConnections = connections.filter((c) => c.date >= weekStartStr);
      const monthConnections = connections.filter((c) => c.date >= monthStartStr);

      // Quality breakdown
      const qualityBreakdown = connections.reduce((acc: any, conn) => {
        const quality = conn.quality || 'unknown';
        acc[quality] = (acc[quality] || 0) + 1;
        return acc;
      }, {});

      // Platform breakdown
      const platformBreakdown = connections.reduce((acc: any, conn) => {
        const type = conn.connectionType || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      stats = {
        today: {
          count: todayConnections.length,
          goal: goals.dailyGoal,
          progress: Math.round((todayConnections.length / goals.dailyGoal) * 100),
        },
        week: {
          count: weekConnections.length,
          goal: goals.weeklyGoal,
          progress: Math.round((weekConnections.length / goals.weeklyGoal) * 100),
        },
        month: {
          count: monthConnections.length,
          goal: goals.monthlyGoal,
          progress: Math.round((monthConnections.length / goals.monthlyGoal) * 100),
        },
        qualityBreakdown,
        platformBreakdown,
      };
    }

    return NextResponse.json({
      success: true,
      connections,
      goals,
      stats,
    });
  } catch (error) {
    console.error('Error fetching connections:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/execution/connections
 * Log new connection (USER-PRIVATE)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const {
      date,
      connectionName,
      connectionType,
      platform,
      quality,
      context: connectionContext,
      followUpNeeded,
      followUpDate,
      clientId,
      notes,
    } = body;

    // Validation
    if (!connectionName || !connectionType) {
      return NextResponse.json(
        { success: false, error: 'Connection name and type are required' },
        { status: 400 }
      );
    }

    const newConnection = await db
      .insert(newConnections)
      .values({
        organizationId: context.organizationId,
        userId: context.userId,
        date: date || new Date().toISOString().split('T')[0],
        connectionName,
        connectionType,
        platform: platform || null,
        quality: quality || null,
        context: connectionContext || null,
        followUpNeeded: followUpNeeded || false,
        followUpDate: followUpDate || null,
        clientId: clientId || null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({ success: true, connection: newConnection[0] }, { status: 201 });
  } catch (error) {
    console.error('Error logging connection:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to log connection' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/business/execution/connections
 * Update connection goals (USER-PRIVATE)
 */
export async function PATCH(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const { dailyGoal, weeklyGoal, monthlyGoal } = body;

    // Get existing goals
    const existingGoals = await db.query.connectionGoals.findFirst({
      where: eq(connectionGoals.userId, context.userId),
    });

    let updatedGoals;

    if (existingGoals) {
      // Update existing
      updatedGoals = await db
        .update(connectionGoals)
        .set({
          dailyGoal: dailyGoal !== undefined ? dailyGoal : existingGoals.dailyGoal,
          weeklyGoal: weeklyGoal !== undefined ? weeklyGoal : existingGoals.weeklyGoal,
          monthlyGoal: monthlyGoal !== undefined ? monthlyGoal : existingGoals.monthlyGoal,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(connectionGoals.userId, context.userId))
        .returning();
    } else {
      // Create new
      updatedGoals = await db
        .insert(connectionGoals)
        .values({
          organizationId: context.organizationId,
          userId: context.userId,
          dailyGoal: dailyGoal || 5,
          weeklyGoal: weeklyGoal || 25,
          monthlyGoal: monthlyGoal || 100,
        })
        .returning();
    }

    return NextResponse.json({ success: true, goals: updatedGoals[0] });
  } catch (error) {
    console.error('Error updating connection goals:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update connection goals' },
      { status: 500 }
    );
  }
}

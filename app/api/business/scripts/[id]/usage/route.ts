import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { dmScripts, scriptUsageLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/business/scripts/[id]/usage
 * Log script usage and update performance metrics
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const { id: scriptId } = params;
    const body = await request.json();

    const {
      outcome,
      clientId,
      notes,
      whatWorked,
      whatDidntWork,
    } = body;

    // Validation
    if (!outcome) {
      return NextResponse.json(
        { error: 'Outcome is required' },
        { status: 400 }
      );
    }

    // Check if script exists and belongs to organization
    const script = await db.query.dmScripts.findFirst({
      where: and(
        eq(dmScripts.id, scriptId),
        eq(dmScripts.organizationId, context.organizationId)
      ),
    });

    if (!script) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }

    // Log the usage
    const usageLog = await db
      .insert(scriptUsageLogs)
      .values({
        organizationId: context.organizationId,
        scriptId,
        userId: context.userId,
        clientId: clientId || null,
        outcome,
        notes: notes || null,
        whatWorked: whatWorked || null,
        whatDidntWork: whatDidntWork || null,
        usedAt: new Date().toISOString(),
      })
      .returning();

    // Update script performance metrics
    // Get all usage logs for this script
    const allLogs = await db.query.scriptUsageLogs.findMany({
      where: eq(scriptUsageLogs.scriptId, scriptId),
    });

    const totalUses = allLogs.length;
    const successfulUses = allLogs.filter(
      (log) => log.outcome === 'success' || log.outcome === 'closed'
    ).length;
    const successRate = totalUses > 0
      ? ((successfulUses / totalUses) * 100).toFixed(2)
      : '0.00';

    // Update the script
    await db
      .update(dmScripts)
      .set({
        timesUsed: totalUses,
        successRate,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(dmScripts.id, scriptId));

    return NextResponse.json({
      success: true,
      usageLog: usageLog[0],
      updatedMetrics: {
        timesUsed: totalUses,
        successRate,
      },
    });
  } catch (error) {
    console.error('Error logging script usage:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to log script usage' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/business/scripts/[id]/usage
 * Get usage logs for a specific script
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const { id: scriptId } = params;

    // Check if script exists and belongs to organization
    const script = await db.query.dmScripts.findFirst({
      where: and(
        eq(dmScripts.id, scriptId),
        eq(dmScripts.organizationId, context.organizationId)
      ),
    });

    if (!script) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }

    // Get all usage logs
    const logs = await db.query.scriptUsageLogs.findMany({
      where: and(
        eq(scriptUsageLogs.scriptId, scriptId),
        eq(scriptUsageLogs.organizationId, context.organizationId)
      ),
      orderBy: (scriptUsageLogs, { desc }) => [desc(scriptUsageLogs.usedAt)],
    });

    // Calculate outcome distribution
    const outcomeDistribution: Record<string, number> = {};
    logs.forEach((log) => {
      outcomeDistribution[log.outcome] = (outcomeDistribution[log.outcome] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      logs,
      stats: {
        totalUses: logs.length,
        successRate: script.successRate,
        outcomeDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching script usage:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch script usage' },
      { status: 500 }
    );
  }
}

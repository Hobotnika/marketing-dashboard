import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import {
  clients,
  clientStageHistory,
  clientHealthMetrics,
  onboardingTasks,
  clientMilestones,
  churnRiskInterventions,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/business/clients/[id]
 * Get single client with all related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const { id } = params;

    // Fetch client
    const client = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, id),
        eq(clients.organizationId, context.organizationId)
      ),
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch related data in parallel
    const [stageHistory, healthMetrics, tasks, milestones, interventions] =
      await Promise.all([
        db.query.clientStageHistory.findMany({
          where: eq(clientStageHistory.clientId, id),
          orderBy: [desc(clientStageHistory.createdAt)],
        }),
        db.query.clientHealthMetrics.findMany({
          where: eq(clientHealthMetrics.clientId, id),
          orderBy: [desc(clientHealthMetrics.date)],
          limit: 20,
        }),
        db.query.onboardingTasks.findMany({
          where: eq(onboardingTasks.clientId, id),
          orderBy: [desc(onboardingTasks.order)],
        }),
        db.query.clientMilestones.findMany({
          where: eq(clientMilestones.clientId, id),
          orderBy: [desc(clientMilestones.achievedDate)],
        }),
        db.query.churnRiskInterventions.findMany({
          where: eq(churnRiskInterventions.clientId, id),
          orderBy: [desc(churnRiskInterventions.interventionDate)],
        }),
      ]);

    return NextResponse.json({
      success: true,
      client,
      stageHistory,
      healthMetrics,
      tasks,
      milestones,
      interventions,
    });
  } catch (error) {
    console.error('Error fetching client:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/business/clients/[id]
 * Update client details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const { id } = params;

    // Verify client exists and belongs to org
    const existingClient = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, id),
        eq(clients.organizationId, context.organizationId)
      ),
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();

    // Update client
    const updatedClient = await db
      .update(clients)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(clients.id, id),
          eq(clients.organizationId, context.organizationId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      client: updatedClient[0],
    });
  } catch (error) {
    console.error('Error updating client:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/clients/[id]
 * Delete a client (cascades to all related data)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const { id } = params;

    // Verify client exists and belongs to org
    const existingClient = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, id),
        eq(clients.organizationId, context.organizationId)
      ),
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Delete client (cascade will handle related data)
    await db
      .delete(clients)
      .where(
        and(
          eq(clients.id, id),
          eq(clients.organizationId, context.organizationId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { clients, clientStageHistory } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/business/clients/[id]/stage
 * Update client journey stage (creates history automatically)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const { id } = params;

    // Fetch current client
    const client = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, id),
        eq(clients.organizationId, context.organizationId)
      ),
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { toStage, reason } = body;

    if (!toStage) {
      return NextResponse.json(
        { error: 'toStage is required' },
        { status: 400 }
      );
    }

    // Create stage history record
    await db.insert(clientStageHistory).values({
      clientId: id,
      organizationId: context.organizationId,
      userId: context.userId,
      fromStage: client.currentStage,
      toStage,
      reason: reason || null,
    });

    // Update client
    const updatedClient = await db
      .update(clients)
      .set({
        currentStage: toStage,
        stageEnteredAt: new Date().toISOString(),
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
    console.error('Error updating client stage:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update client stage' },
      { status: 500 }
    );
  }
}

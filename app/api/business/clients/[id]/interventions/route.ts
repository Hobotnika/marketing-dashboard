import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { churnRiskInterventions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await protectTenantRoute();

    const interventions = await db.query.churnRiskInterventions.findMany({
      where: eq(churnRiskInterventions.clientId, params.id),
      orderBy: [desc(churnRiskInterventions.interventionDate)],
    });

    return NextResponse.json({ success: true, interventions });
  } catch (error) {
    console.error('Error fetching interventions:', error);
    return NextResponse.json({ error: 'Failed to fetch interventions' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const body = await request.json();

    const newIntervention = await db
      .insert(churnRiskInterventions)
      .values({
        clientId: params.id,
        organizationId: context.organizationId,
        userId: context.userId,
        ...body,
      })
      .returning();

    return NextResponse.json({ success: true, intervention: newIntervention[0] });
  } catch (error) {
    console.error('Error creating intervention:', error);
    return NextResponse.json({ error: 'Failed to create intervention' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await protectTenantRoute();
    const body = await request.json();
    const { id, ...updates } = body;

    const updatedIntervention = await db
      .update(churnRiskInterventions)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(churnRiskInterventions.id, id))
      .returning();

    return NextResponse.json({ success: true, intervention: updatedIntervention[0] });
  } catch (error) {
    console.error('Error updating intervention:', error);
    return NextResponse.json({ error: 'Failed to update intervention' }, { status: 500 });
  }
}

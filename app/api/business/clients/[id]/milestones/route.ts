import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { clientMilestones } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await protectTenantRoute();

    const milestones = await db.query.clientMilestones.findMany({
      where: eq(clientMilestones.clientId, params.id),
      orderBy: [desc(clientMilestones.achievedDate)],
    });

    return NextResponse.json({ success: true, milestones });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const body = await request.json();

    const newMilestone = await db
      .insert(clientMilestones)
      .values({
        clientId: params.id,
        organizationId: context.organizationId,
        userId: context.userId,
        ...body,
      })
      .returning();

    return NextResponse.json({ success: true, milestone: newMilestone[0] });
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await protectTenantRoute();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await db.delete(clientMilestones).where(eq(clientMilestones.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
  }
}

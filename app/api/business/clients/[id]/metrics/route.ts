import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { clientHealthMetrics } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();

    const metrics = await db.query.clientHealthMetrics.findMany({
      where: eq(clientHealthMetrics.clientId, params.id),
      orderBy: [desc(clientHealthMetrics.date)],
      limit: 50,
    });

    return NextResponse.json({ success: true, metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const body = await request.json();

    const newMetric = await db
      .insert(clientHealthMetrics)
      .values({
        clientId: params.id,
        organizationId: context.organizationId,
        userId: context.userId,
        ...body,
      })
      .returning();

    return NextResponse.json({ success: true, metric: newMetric[0] });
  } catch (error) {
    console.error('Error creating metric:', error);
    return NextResponse.json({ error: 'Failed to create metric' }, { status: 500 });
  }
}

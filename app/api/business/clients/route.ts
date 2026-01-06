import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { eq, desc, or, like, sql } from 'drizzle-orm';

/**
 * GET /api/business/clients
 * List clients with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // filter by status
    const stage = searchParams.get('stage'); // filter by journey stage
    const search = searchParams.get('search'); // search by name/email/company

    // Build query
    let conditions = [eq(clients.organizationId, context.organizationId)];

    if (status && status !== 'all') {
      conditions.push(eq(clients.status, status));
    }

    if (stage && stage !== 'all') {
      conditions.push(eq(clients.currentStage, stage));
    }

    if (search) {
      conditions.push(
        or(
          like(clients.name, `%${search}%`),
          like(clients.email, `%${search}%`),
          like(clients.company, `%${search}%`)
        )!
      );
    }

    const clientList = await db
      .select()
      .from(clients)
      .where(sql`${sql.join(conditions, sql` AND `)}`  )
      .orderBy(desc(clients.createdAt));

    // Calculate summary stats
    const totalClients = clientList.length;
    const activeClients = clientList.filter((c) => c.status === 'active').length;
    const atRiskClients = clientList.filter(
      (c) => c.status === 'at_risk' || c.healthScore < 50
    ).length;
    const avgHealthScore =
      totalClients > 0
        ? Math.round(
            clientList.reduce((sum, c) => sum + c.healthScore, 0) / totalClients
          )
        : 0;

    return NextResponse.json({
      success: true,
      clients: clientList,
      summary: {
        totalClients,
        activeClients,
        atRiskClients,
        avgHealthScore,
      },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/clients
 * Create a new client
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const {
      name,
      email,
      phone,
      company,
      industry,
      plan,
      mrr,
      contractStartDate,
      contractEndDate,
      notes,
    } = body;

    // Validation
    if (!name || !contractStartDate) {
      return NextResponse.json(
        { error: 'Name and contract start date are required' },
        { status: 400 }
      );
    }

    const newClient = await db
      .insert(clients)
      .values({
        organizationId: context.organizationId,
        userId: context.userId,
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        industry: industry || null,
        plan: plan || 'starter',
        mrr: mrr ? mrr.toString() : '0.00',
        contractStartDate: contractStartDate, // ISO string from frontend
        contractEndDate: contractEndDate || null,
        status: 'active',
        currentStage: 'sign_up',
        healthScore: 50,
        stageEnteredAt: new Date().toISOString(),
        lastActivityDate: new Date().toISOString(),
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      client: newClient[0],
    });
  } catch (error) {
    console.error('Error creating client:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

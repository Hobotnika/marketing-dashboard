import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { offers, offerActivities, clients } from '@/lib/db/schema';
import { eq, and, desc, or, sql, like } from 'drizzle-orm';
import { protectTenantRoute } from '@/lib/api/tenant-security';

/**
 * Generate unique offer ID (OFF-YYYY-NNN format)
 */
async function generateOfferId(workspaceId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OFF-${year}-`;

  // Get the highest offer ID for this year
  const existingOffers = await db
    .select()
    .from(offers)
    .where(
      and(
        eq(offers.workspaceId, workspaceId),
        like(offers.offerId, `${prefix}%`)
      )
    )
    .orderBy(desc(offers.offerId))
    .limit(1);

  if (existingOffers.length === 0) {
    return `${prefix}001`;
  }

  // Extract the number from the last offer ID and increment
  const lastOfferId = existingOffers[0].offerId;
  const lastNumber = parseInt(lastOfferId.split('-')[2], 10);
  const nextNumber = (lastNumber + 1).toString().padStart(3, '0');

  return `${prefix}${nextNumber}`;
}

/**
 * Generate unique share link (random hash)
 */
function generateShareLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * GET /api/business/offers
 * List all offers with filters
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search');

    // Build where conditions
    let whereConditions = [eq(offers.workspaceId, context.workspaceId)];

    if (status && status !== 'all') {
      whereConditions.push(eq(offers.status, status));
    }

    if (clientId) {
      whereConditions.push(eq(offers.clientId, clientId));
    }

    // Fetch offers with client data
    const offersList = await db.query.offers.findMany({
      where: and(...whereConditions),
      orderBy: [desc(offers.createdAt)],
      with: {
        client: true,
        template: true,
        creator: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Apply search filter if provided
    let filteredOffers = offersList;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOffers = offersList.filter(
        (offer) =>
          offer.title.toLowerCase().includes(searchLower) ||
          offer.offerId.toLowerCase().includes(searchLower) ||
          (offer.client?.name.toLowerCase().includes(searchLower))
      );
    }

    // Calculate summary statistics
    const summary = {
      totalOffers: filteredOffers.length,
      draft: filteredOffers.filter((o) => o.status === 'draft').length,
      sent: filteredOffers.filter((o) => o.status === 'sent').length,
      viewed: filteredOffers.filter((o) => o.status === 'viewed').length,
      accepted: filteredOffers.filter((o) => o.status === 'accepted').length,
      declined: filteredOffers.filter((o) => o.status === 'declined').length,
      expired: filteredOffers.filter((o) => o.status === 'expired').length,
      totalValue: filteredOffers
        .filter((o) => o.status === 'accepted')
        .reduce((sum, o) => sum + parseFloat(o.finalValue), 0)
        .toFixed(2),
      acceptanceRate:
        filteredOffers.filter((o) => ['accepted', 'declined'].includes(o.status)).length > 0
          ? (
              (filteredOffers.filter((o) => o.status === 'accepted').length /
                filteredOffers.filter((o) => ['accepted', 'declined'].includes(o.status)).length) *
              100
            ).toFixed(1)
          : '0.0',
    };

    return NextResponse.json({
      success: true,
      offers: filteredOffers,
      summary,
      count: filteredOffers.length,
    });
  } catch (error) {
    console.error('Error fetching offers:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/offers
 * Create a new offer
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const {
      title,
      clientId,
      templateId,
      content,
      customMessage,
      totalValue,
      discountAmount,
      finalValue,
      currency,
      paymentTerms,
      dueDate,
      validUntil,
    } = body;

    // Validation
    if (!title || !content || !totalValue || !finalValue) {
      return NextResponse.json(
        { success: false, error: 'Title, content, total value, and final value are required' },
        { status: 400 }
      );
    }

    // Verify client exists if provided
    if (clientId) {
      const client = await db.query.clients.findFirst({
        where: and(
          eq(clients.id, clientId),
          eq(clients.workspaceId, context.workspaceId)
        ),
      });

      if (!client) {
        return NextResponse.json(
          { success: false, error: 'Client not found' },
          { status: 404 }
        );
      }
    }

    // Auto-generate offer ID and share link
    const offerId = await generateOfferId(context.workspaceId);
    const uniqueShareLink = generateShareLink();

    const newOffer = await db
      .insert(offers)
      .values({
        workspaceId: context.workspaceId,
        userId: context.userId,
        clientId: clientId || null,
        templateId: templateId || null,
        offerId,
        title,
        uniqueShareLink,
        content: JSON.stringify(content),
        customMessage: customMessage || null,
        totalValue: totalValue.toString(),
        discountAmount: discountAmount ? discountAmount.toString() : '0.00',
        finalValue: finalValue.toString(),
        currency: currency || 'USD',
        paymentTerms: paymentTerms || null,
        dueDate: dueDate || null,
        validUntil: validUntil || null,
        status: 'draft',
      })
      .returning();

    // Log activity
    await db.insert(offerActivities).values({
      offerId: newOffer[0].id,
      workspaceId: context.workspaceId,
      activityType: 'created',
      performedBy: context.userId,
      notes: 'Offer created',
    });

    return NextResponse.json(
      { success: true, offer: newOffer[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating offer:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}

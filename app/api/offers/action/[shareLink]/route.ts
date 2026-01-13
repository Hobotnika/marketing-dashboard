import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { offers, offerActivities, offerTemplates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/offers/action/[shareLink]
 * Public endpoint - Client actions (accept, decline) - NO AUTH REQUIRED
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { shareLink: string } }
) {
  try {
    const body = await request.json();
    const { action, reason } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    // Fetch offer by share link
    const existingOffer = await db.query.offers.findFirst({
      where: eq(offers.uniqueShareLink, params.shareLink),
    });

    if (!existingOffer) {
      return NextResponse.json(
        { success: false, error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Check if offer has already been decided
    if (['accepted', 'declined', 'expired'].includes(existingOffer.status)) {
      return NextResponse.json(
        { success: false, error: `Offer has already been ${existingOffer.status}` },
        { status: 400 }
      );
    }

    // Check if offer has expired
    if (existingOffer.validUntil) {
      const validUntilDate = new Date(existingOffer.validUntil);
      if (validUntilDate < new Date()) {
        await db
          .update(offers)
          .set({
            status: 'expired',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(offers.id, existingOffer.id));

        return NextResponse.json(
          { success: false, error: 'This offer has expired' },
          { status: 400 }
        );
      }
    }

    // Extract client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Handle actions
    if (action === 'accept') {
      // Update offer status
      const updatedOffer = await db
        .update(offers)
        .set({
          status: 'accepted',
          decisionDate: new Date().toISOString(),
          decisionReason: reason || null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(offers.id, existingOffer.id))
        .returning();

      // Log activity
      await db.insert(offerActivities).values({
        offerId: existingOffer.id,
        workspaceId: existingOffer.workspaceId,
        activityType: 'accepted',
        performedBy: null, // Client action
        ipAddress,
        userAgent,
        notes: reason || 'Offer accepted by client',
      });

      // Update template acceptance rate if template was used
      if (existingOffer.templateId) {
        const templateOffers = await db
          .select()
          .from(offers)
          .where(
            and(
              eq(offers.templateId, existingOffer.templateId),
              eq(offers.workspaceId, existingOffer.workspaceId)
            )
          );

        const decidedOffers = templateOffers.filter((o) =>
          ['accepted', 'declined'].includes(o.status)
        );
        const acceptedOffers = decidedOffers.filter((o) => o.status === 'accepted');

        const acceptanceRate =
          decidedOffers.length > 0
            ? ((acceptedOffers.length / decidedOffers.length) * 100).toFixed(2)
            : '0.00';

        await db
          .update(offerTemplates)
          .set({ averageAcceptanceRate: acceptanceRate })
          .where(eq(offerTemplates.id, existingOffer.templateId));
      }

      return NextResponse.json({
        success: true,
        message: 'Offer accepted successfully',
        offer: updatedOffer[0],
      });
    } else if (action === 'decline') {
      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'Please provide a reason for declining' },
          { status: 400 }
        );
      }

      // Update offer status
      const updatedOffer = await db
        .update(offers)
        .set({
          status: 'declined',
          decisionDate: new Date().toISOString(),
          decisionReason: reason,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(offers.id, existingOffer.id))
        .returning();

      // Log activity
      await db.insert(offerActivities).values({
        offerId: existingOffer.id,
        workspaceId: existingOffer.workspaceId,
        activityType: 'declined',
        performedBy: null, // Client action
        ipAddress,
        userAgent,
        notes: reason,
      });

      // Update template acceptance rate
      if (existingOffer.templateId) {
        const templateOffers = await db
          .select()
          .from(offers)
          .where(
            and(
              eq(offers.templateId, existingOffer.templateId),
              eq(offers.workspaceId, existingOffer.workspaceId)
            )
          );

        const decidedOffers = templateOffers.filter((o) =>
          ['accepted', 'declined'].includes(o.status)
        );
        const acceptedOffers = decidedOffers.filter((o) => o.status === 'accepted');

        const acceptanceRate =
          decidedOffers.length > 0
            ? ((acceptedOffers.length / decidedOffers.length) * 100).toFixed(2)
            : '0.00';

        await db
          .update(offerTemplates)
          .set({ averageAcceptanceRate: acceptanceRate })
          .where(eq(offerTemplates.id, existingOffer.templateId));
      }

      return NextResponse.json({
        success: true,
        message: 'Thank you for your response',
        offer: updatedOffer[0],
      });
    } else {
      return NextResponse.json(
        { success: false, error: `Unknown action: ${action}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing offer action:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to process action' },
      { status: 500 }
    );
  }
}

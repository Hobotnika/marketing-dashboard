import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { offers, offerActivities, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/offers/view/[shareLink]
 * Public endpoint - Get offer by share link (NO AUTH REQUIRED)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shareLink: string } }
) {
  try {
    // Fetch offer by unique share link
    const offer = await db.query.offers.findFirst({
      where: eq(offers.uniqueShareLink, params.shareLink),
      with: {
        client: {
          columns: {
            name: true,
            company: true,
          },
        },
        organization: {
          columns: {
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Check if offer has expired
    if (offer.validUntil) {
      const validUntilDate = new Date(offer.validUntil);
      if (validUntilDate < new Date() && offer.status !== 'accepted') {
        // Auto-expire the offer
        await db
          .update(offers)
          .set({
            status: 'expired',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(offers.id, offer.id));

        offer.status = 'expired';
      }
    }

    // Log view activity (only if first view)
    if (offer.status === 'sent' && !offer.viewedDate) {
      // Extract client IP and user agent
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      // Update offer status to viewed
      await db
        .update(offers)
        .set({
          status: 'viewed',
          viewedDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(offers.id, offer.id));

      // Log activity
      await db.insert(offerActivities).values({
        offerId: offer.id,
        organizationId: offer.organizationId,
        activityType: 'viewed',
        performedBy: null, // Client view, no user
        ipAddress,
        userAgent,
        notes: 'Offer viewed by client',
      });
    }

    // Parse content from JSON
    const content = JSON.parse(offer.content);

    // Return sanitized offer data
    return NextResponse.json({
      success: true,
      offer: {
        id: offer.id,
        offerId: offer.offerId,
        title: offer.title,
        content,
        customMessage: offer.customMessage,
        totalValue: offer.totalValue,
        discountAmount: offer.discountAmount,
        finalValue: offer.finalValue,
        currency: offer.currency,
        paymentTerms: offer.paymentTerms,
        validUntil: offer.validUntil,
        status: offer.status,
        organization: {
          name: offer.organization?.name,
          logoUrl: offer.organization?.logoUrl,
        },
        client: {
          name: offer.client?.name,
          company: offer.client?.company,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching public offer:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch offer' },
      { status: 500 }
    );
  }
}

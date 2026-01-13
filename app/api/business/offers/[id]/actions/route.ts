import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { offers, offerActivities, offerTemplates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { protectTenantRoute } from '@/lib/api/tenant-security';

/**
 * Generate unique offer ID (OFF-YYYY-NNN format)
 */
async function generateOfferId(workspaceId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OFF-${year}-`;

  // Get count of offers for this year
  const existingCount = await db
    .select()
    .from(offers)
    .where(
      and(
        eq(offers.workspaceId, workspaceId),
        eq(offers.offerId, `${prefix}%`)
      )
    );

  const nextNumber = (existingCount.length + 1).toString().padStart(3, '0');
  return `${prefix}${nextNumber}`;
}

/**
 * Generate unique share link
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
 * POST /api/business/offers/[id]/actions
 * Perform actions on an offer: send, accept, decline, duplicate, archive
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const { action, reason } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    // Check if offer exists and belongs to organization
    const existingOffer = await db.query.offers.findFirst({
      where: and(
        eq(offers.id, params.id),
        eq(offers.workspaceId, context.workspaceId)
      ),
    });

    if (!existingOffer) {
      return NextResponse.json(
        { success: false, error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'send': {
        // Can only send draft offers
        if (existingOffer.status !== 'draft') {
          return NextResponse.json(
            { success: false, error: 'Can only send draft offers' },
            { status: 400 }
          );
        }

        // Update status to sent
        const updatedOffer = await db
          .update(offers)
          .set({
            status: 'sent',
            sentDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(offers.id, params.id),
              eq(offers.workspaceId, context.workspaceId)
            )
          )
          .returning();

        // Log activity
        await db.insert(offerActivities).values({
          offerId: params.id,
          workspaceId: context.workspaceId,
          activityType: 'sent',
          performedBy: context.userId,
          notes: 'Offer sent to client',
        });

        // Increment template usage count if template was used
        if (existingOffer.templateId) {
          await db
            .update(offerTemplates)
            .set({
              timesUsed: existingOffer.template?.timesUsed ? existingOffer.template.timesUsed + 1 : 1,
            })
            .where(eq(offerTemplates.id, existingOffer.templateId));
        }

        return NextResponse.json({
          success: true,
          offer: updatedOffer[0],
          message: 'Offer sent successfully',
        });
      }

      case 'accept': {
        // Can only accept sent or viewed offers
        if (!['sent', 'viewed'].includes(existingOffer.status)) {
          return NextResponse.json(
            { success: false, error: 'Can only accept sent or viewed offers' },
            { status: 400 }
          );
        }

        // Update status to accepted
        const updatedOffer = await db
          .update(offers)
          .set({
            status: 'accepted',
            decisionDate: new Date().toISOString(),
            decisionReason: reason || null,
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(offers.id, params.id),
              eq(offers.workspaceId, context.workspaceId)
            )
          )
          .returning();

        // Log activity
        await db.insert(offerActivities).values({
          offerId: params.id,
          workspaceId: context.workspaceId,
          activityType: 'accepted',
          performedBy: context.userId,
          notes: reason || 'Offer accepted',
        });

        // Update template acceptance rate if template was used
        if (existingOffer.templateId) {
          // Get all offers using this template that have been accepted or declined
          const templateOffers = await db
            .select()
            .from(offers)
            .where(
              and(
                eq(offers.templateId, existingOffer.templateId),
                eq(offers.workspaceId, context.workspaceId)
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
          offer: updatedOffer[0],
          message: 'Offer accepted',
        });
      }

      case 'decline': {
        // Can only decline sent or viewed offers
        if (!['sent', 'viewed'].includes(existingOffer.status)) {
          return NextResponse.json(
            { success: false, error: 'Can only decline sent or viewed offers' },
            { status: 400 }
          );
        }

        if (!reason) {
          return NextResponse.json(
            { success: false, error: 'Reason is required for declining' },
            { status: 400 }
          );
        }

        // Update status to declined
        const updatedOffer = await db
          .update(offers)
          .set({
            status: 'declined',
            decisionDate: new Date().toISOString(),
            decisionReason: reason,
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(offers.id, params.id),
              eq(offers.workspaceId, context.workspaceId)
            )
          )
          .returning();

        // Log activity
        await db.insert(offerActivities).values({
          offerId: params.id,
          workspaceId: context.workspaceId,
          activityType: 'declined',
          performedBy: context.userId,
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
                eq(offers.workspaceId, context.workspaceId)
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
          offer: updatedOffer[0],
          message: 'Offer declined',
        });
      }

      case 'duplicate': {
        // Generate new IDs
        const newOfferId = await generateOfferId(context.workspaceId);
        const newShareLink = generateShareLink();

        // Create duplicate offer
        const duplicateOffer = await db
          .insert(offers)
          .values({
            workspaceId: context.workspaceId,
            userId: context.userId,
            clientId: existingOffer.clientId,
            templateId: existingOffer.templateId,
            offerId: newOfferId,
            title: `${existingOffer.title} (Copy)`,
            uniqueShareLink: newShareLink,
            content: existingOffer.content,
            customMessage: existingOffer.customMessage,
            totalValue: existingOffer.totalValue,
            discountAmount: existingOffer.discountAmount,
            finalValue: existingOffer.finalValue,
            currency: existingOffer.currency,
            paymentTerms: existingOffer.paymentTerms,
            dueDate: existingOffer.dueDate,
            validUntil: existingOffer.validUntil,
            status: 'draft', // Always start as draft
          })
          .returning();

        // Log activity on the new offer
        await db.insert(offerActivities).values({
          offerId: duplicateOffer[0].id,
          workspaceId: context.workspaceId,
          activityType: 'created',
          performedBy: context.userId,
          notes: `Duplicated from ${existingOffer.offerId}`,
        });

        return NextResponse.json({
          success: true,
          offer: duplicateOffer[0],
          message: 'Offer duplicated successfully',
        });
      }

      default: {
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('Error performing offer action:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to perform offer action' },
      { status: 500 }
    );
  }
}

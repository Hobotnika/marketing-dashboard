import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { offers, offerActivities, offerVersions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { protectTenantRoute } from '@/lib/api/tenant-security';

/**
 * GET /api/business/offers/[id]
 * Get a specific offer with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();

    const offer = await db.query.offers.findFirst({
      where: and(
        eq(offers.id, params.id),
        eq(offers.workspaceId, context.workspaceId)
      ),
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
        activities: {
          orderBy: [desc(offerActivities.createdAt)],
          limit: 20,
        },
        versions: {
          orderBy: [desc(offerVersions.createdAt)],
          limit: 10,
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, error: 'Offer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, offer });
  } catch (error) {
    console.error('Error fetching offer:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch offer' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/business/offers/[id]
 * Update an offer
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();

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

    // Only allow editing draft offers
    if (existingOffer.status !== 'draft') {
      return NextResponse.json(
        { success: false, error: 'Can only edit draft offers' },
        { status: 400 }
      );
    }

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
      createVersion,
      changesSummary,
    } = body;

    // Build update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (clientId !== undefined) updateData.clientId = clientId;
    if (templateId !== undefined) updateData.templateId = templateId;
    if (content !== undefined) updateData.content = JSON.stringify(content);
    if (customMessage !== undefined) updateData.customMessage = customMessage;
    if (totalValue !== undefined) updateData.totalValue = totalValue.toString();
    if (discountAmount !== undefined) updateData.discountAmount = discountAmount.toString();
    if (finalValue !== undefined) updateData.finalValue = finalValue.toString();
    if (currency !== undefined) updateData.currency = currency;
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (validUntil !== undefined) updateData.validUntil = validUntil;

    // Create version if requested
    if (createVersion) {
      // Get current highest version number
      const versions = await db
        .select()
        .from(offerVersions)
        .where(eq(offerVersions.offerId, params.id))
        .orderBy(desc(offerVersions.versionNumber))
        .limit(1);

      const nextVersionNumber = versions.length > 0 ? versions[0].versionNumber + 1 : 1;

      await db.insert(offerVersions).values({
        offerId: params.id,
        workspaceId: context.workspaceId,
        versionNumber: nextVersionNumber,
        changesSummary: changesSummary || 'Updated offer',
        createdBy: context.userId,
        contentSnapshot: JSON.stringify(existingOffer),
      });
    }

    const updatedOffer = await db
      .update(offers)
      .set(updateData)
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
      activityType: 'edited',
      performedBy: context.userId,
      notes: changesSummary || 'Offer updated',
    });

    return NextResponse.json({ success: true, offer: updatedOffer[0] });
  } catch (error) {
    console.error('Error updating offer:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update offer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/offers/[id]
 * Delete an offer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();

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

    // Only allow deleting draft offers
    if (existingOffer.status !== 'draft') {
      return NextResponse.json(
        { success: false, error: 'Can only delete draft offers' },
        { status: 400 }
      );
    }

    await db
      .delete(offers)
      .where(
        and(
          eq(offers.id, params.id),
          eq(offers.workspaceId, context.workspaceId)
        )
      );

    return NextResponse.json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Error deleting offer:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete offer' },
      { status: 500 }
    );
  }
}

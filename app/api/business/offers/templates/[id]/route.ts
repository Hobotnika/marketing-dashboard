import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { offerTemplates, offers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { protectTenantRoute } from '@/lib/api/tenant-security';

/**
 * GET /api/business/offers/templates/[id]
 * Get a specific offer template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();

    const template = await db.query.offerTemplates.findFirst({
      where: and(
        eq(offerTemplates.id, params.id),
        eq(offerTemplates.organizationId, context.organizationId)
      ),
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Error fetching template:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/business/offers/templates/[id]
 * Update an offer template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();

    // Check if template exists and belongs to organization
    const existingTemplate = await db.query.offerTemplates.findFirst({
      where: and(
        eq(offerTemplates.id, params.id),
        eq(offerTemplates.organizationId, context.organizationId)
      ),
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      category,
      description,
      structureType,
      sections,
      defaultTerms,
      isDefaultTemplate,
    } = body;

    // Build update object (only include provided fields)
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (category !== undefined) {
      // Validate category
      const validCategories = ['service', 'product', 'package', 'consulting', 'retainer', 'custom'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { success: false, error: `Category must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.category = category;
    }
    if (description !== undefined) updateData.description = description;
    if (structureType !== undefined) {
      // Validate structure type
      const validStructureTypes = ['single_tier', 'tiered', 'custom'];
      if (!validStructureTypes.includes(structureType)) {
        return NextResponse.json(
          { success: false, error: `Structure type must be one of: ${validStructureTypes.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.structureType = structureType;
    }
    if (sections !== undefined) updateData.sections = JSON.stringify(sections);
    if (defaultTerms !== undefined) updateData.defaultTerms = defaultTerms;
    if (isDefaultTemplate !== undefined) updateData.isDefaultTemplate = isDefaultTemplate;

    const updatedTemplate = await db
      .update(offerTemplates)
      .set(updateData)
      .where(
        and(
          eq(offerTemplates.id, params.id),
          eq(offerTemplates.organizationId, context.organizationId)
        )
      )
      .returning();

    return NextResponse.json({ success: true, template: updatedTemplate[0] });
  } catch (error) {
    console.error('Error updating template:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/offers/templates/[id]
 * Delete an offer template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();

    // Check if template exists and belongs to organization
    const existingTemplate = await db.query.offerTemplates.findFirst({
      where: and(
        eq(offerTemplates.id, params.id),
        eq(offerTemplates.organizationId, context.organizationId)
      ),
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if template is being used by any offers
    const offersUsingTemplate = await db
      .select()
      .from(offers)
      .where(
        and(
          eq(offers.templateId, params.id),
          eq(offers.organizationId, context.organizationId)
        )
      )
      .limit(1);

    if (offersUsingTemplate.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete template - it is being used by existing offers',
        },
        { status: 400 }
      );
    }

    // Don't allow deleting default templates
    if (existingTemplate.isDefaultTemplate) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default template' },
        { status: 400 }
      );
    }

    await db
      .delete(offerTemplates)
      .where(
        and(
          eq(offerTemplates.id, params.id),
          eq(offerTemplates.organizationId, context.organizationId)
        )
      );

    return NextResponse.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { offerTemplates } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { protectTenantRoute } from '@/lib/api/tenant-security';

/**
 * GET /api/business/offers/templates
 * List all offer templates for the organization
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Build query
    let whereConditions = [eq(offerTemplates.organizationId, context.organizationId)];

    if (category && category !== 'all') {
      whereConditions.push(eq(offerTemplates.category, category));
    }

    const templates = await db
      .select()
      .from(offerTemplates)
      .where(and(...whereConditions))
      .orderBy(desc(offerTemplates.timesUsed), desc(offerTemplates.createdAt));

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('Error fetching offer templates:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch offer templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/offers/templates
 * Create a new offer template
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

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

    // Validation
    if (!name || !category || !structureType || !sections) {
      return NextResponse.json(
        { success: false, error: 'Name, category, structure type, and sections are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['service', 'product', 'package', 'consulting', 'retainer', 'custom'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate structure type
    const validStructureTypes = ['single_tier', 'tiered', 'custom'];
    if (!validStructureTypes.includes(structureType)) {
      return NextResponse.json(
        { success: false, error: `Structure type must be one of: ${validStructureTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const newTemplate = await db
      .insert(offerTemplates)
      .values({
        organizationId: context.organizationId,
        userId: context.userId,
        name,
        category,
        description: description || null,
        structureType,
        sections: JSON.stringify(sections),
        defaultTerms: defaultTerms || null,
        isDefaultTemplate: isDefaultTemplate || false,
        timesUsed: 0,
        averageAcceptanceRate: '0.00',
      })
      .returning();

    return NextResponse.json(
      { success: true, template: newTemplate[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating offer template:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create offer template' },
      { status: 500 }
    );
  }
}

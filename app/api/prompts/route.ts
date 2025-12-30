import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiPrompts } from '@/lib/db/schema';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { eq, and, isNull, or, like, desc } from 'drizzle-orm';

// GET /api/prompts - List prompts with filters
export const GET = withTenantSecurity(async (request, context) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category'); // 'meta_ads' | 'google_ads'
  const search = searchParams.get('search');

  try {
    const conditions = [];

    // User can see their org's prompts + system defaults (organizationId = NULL)
    conditions.push(
      or(
        eq(aiPrompts.organizationId, context.organizationId),
        isNull(aiPrompts.organizationId)
      )
    );

    // Filter by category if provided
    if (category === 'meta_ads' || category === 'google_ads') {
      conditions.push(eq(aiPrompts.category, category));
    }

    // Search by name if provided
    if (search) {
      conditions.push(like(aiPrompts.name, `%${search}%`));
    }

    const prompts = await db.query.aiPrompts.findMany({
      where: and(...conditions),
      orderBy: [desc(aiPrompts.isDefault), desc(aiPrompts.createdAt)],
    });

    return NextResponse.json({
      success: true,
      data: prompts,
    });
  } catch (error: any) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch prompts',
        details: error.message,
      },
      { status: 500 }
    );
  }
});

// POST /api/prompts - Create new prompt
export const POST = withTenantSecurity(async (request, context) => {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      promptType,
      promptText,
      isDefault,
      isActive,
    } = body;

    // Validation
    if (!name || !category || !promptText) {
      return NextResponse.json(
        {
          success: false,
          error: 'name, category, and promptText are required',
        },
        { status: 400 }
      );
    }

    if (!['meta_ads', 'google_ads'].includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: 'category must be either meta_ads or google_ads',
        },
        { status: 400 }
      );
    }

    // If setting as default, unset previous default for this category
    if (isDefault) {
      await db
        .update(aiPrompts)
        .set({ isDefault: false })
        .where(
          and(
            eq(aiPrompts.organizationId, context.organizationId),
            eq(aiPrompts.category, category),
            eq(aiPrompts.isDefault, true)
          )
        );
    }

    // Create the prompt
    const [newPrompt] = await db
      .insert(aiPrompts)
      .values({
        organizationId: context.organizationId,
        name,
        description: description || null,
        category,
        promptType: promptType || 'custom',
        promptText,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: context.userId,
        usageCount: 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newPrompt,
      message: 'Prompt created successfully',
    });
  } catch (error: any) {
    console.error('Error creating prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create prompt',
        details: error.message,
      },
      { status: 500 }
    );
  }
});

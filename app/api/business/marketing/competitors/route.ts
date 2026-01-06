import { NextResponse } from 'next/server';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { competitors } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/business/marketing/competitors
 * List competitors for the organization
 *
 * Security: Protected by withTenantSecurity
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    console.log('[Marketing/Competitors] Fetching for org:', context.organizationId);

    const competitorsList = await db
      .select()
      .from(competitors)
      .where(eq(competitors.organizationId, context.organizationId))
      .orderBy(desc(competitors.createdAt));

    console.log('[Marketing/Competitors] Found', competitorsList.length, 'competitors');

    return NextResponse.json({
      success: true,
      competitors: competitorsList,
      count: competitorsList.length,
    });
  } catch (error) {
    console.error('[Marketing/Competitors] Error fetching:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch competitors',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/business/marketing/competitors
 * Add a new competitor
 *
 * Body:
 * - name: string (required)
 * - website: string (optional)
 * - description: string (optional)
 * - strengths: string (optional)
 * - weaknesses: string (optional)
 *
 * Security: Protected by withTenantSecurity
 */
export const POST = withTenantSecurity(async (request: Request, context) => {
  try {
    const body = await request.json();
    const { name, website, description, strengths, weaknesses } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    console.log('[Marketing/Competitors] Creating for org:', context.organizationId);
    console.log('[Marketing/Competitors] Name:', name);

    // Create competitor
    const [newCompetitor] = await db
      .insert(competitors)
      .values({
        organizationId: context.organizationId,
        userId: context.userId,
        name,
        website: website || null,
        description: description || null,
        strengths: strengths || null,
        weaknesses: weaknesses || null,
      })
      .returning();

    console.log('[Marketing/Competitors] ✅ Created successfully');

    return NextResponse.json({
      success: true,
      competitor: newCompetitor,
      message: 'Competitor created successfully',
    });
  } catch (error) {
    console.error('[Marketing/Competitors] Error creating:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create competitor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/business/marketing/competitors
 * Update a competitor (typically for analysis updates)
 *
 * Query params:
 * - id: string (required) - ID of competitor to update
 *
 * Body:
 * - name: string (optional)
 * - website: string (optional)
 * - description: string (optional)
 * - strengths: string (optional)
 * - weaknesses: string (optional)
 *
 * Security: Protected by withTenantSecurity
 */
export const PATCH = withTenantSecurity(async (request: Request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, website, description, strengths, weaknesses } = body;

    console.log('[Marketing/Competitors] Updating ID:', id);
    console.log('[Marketing/Competitors] Organization:', context.organizationId);

    // Prepare update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (website !== undefined) updateData.website = website;
    if (description !== undefined) updateData.description = description;
    if (strengths !== undefined) {
      updateData.strengths = strengths;
      updateData.lastAnalyzedAt = new Date().toISOString();
    }
    if (weaknesses !== undefined) {
      updateData.weaknesses = weaknesses;
      if (!updateData.lastAnalyzedAt) {
        updateData.lastAnalyzedAt = new Date().toISOString();
      }
    }

    // Update competitor (with organization check for security)
    const result = await db
      .update(competitors)
      .set(updateData)
      .where(
        and(
          eq(competitors.id, id),
          eq(competitors.organizationId, context.organizationId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Competitor not found or access denied' },
        { status: 404 }
      );
    }

    console.log('[Marketing/Competitors] ✅ Updated successfully');

    return NextResponse.json({
      success: true,
      competitor: result[0],
      message: 'Competitor updated successfully',
    });
  } catch (error) {
    console.error('[Marketing/Competitors] Error updating:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update competitor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/business/marketing/competitors
 * Delete a competitor
 *
 * Query params:
 * - id: string (required) - ID of competitor to delete
 *
 * Security: Protected by withTenantSecurity
 */
export const DELETE = withTenantSecurity(async (request: Request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    console.log('[Marketing/Competitors] Deleting ID:', id);
    console.log('[Marketing/Competitors] Organization:', context.organizationId);

    // Delete competitor (with organization check for security)
    const result = await db
      .delete(competitors)
      .where(
        and(
          eq(competitors.id, id),
          eq(competitors.organizationId, context.organizationId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Competitor not found or access denied' },
        { status: 404 }
      );
    }

    console.log('[Marketing/Competitors] ✅ Deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Competitor deleted successfully',
    });
  } catch (error) {
    console.error('[Marketing/Competitors] Error deleting:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete competitor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

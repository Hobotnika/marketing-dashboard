import { NextResponse } from 'next/server';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { marketDefinitions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/business/marketing/market
 * Fetch market definition for the organization
 *
 * Security: Protected by withTenantSecurity
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    console.log('[Marketing/Market] Fetching for org:', context.workspaceId);

    const marketDef = await db.query.marketDefinitions.findFirst({
      where: eq(marketDefinitions.workspaceId, context.workspaceId),
    });

    console.log('[Marketing/Market] Found:', marketDef ? 'Yes' : 'No');

    return NextResponse.json({
      success: true,
      marketDefinition: marketDef || null,
    });
  } catch (error) {
    console.error('[Marketing/Market] Error fetching:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch market definition',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/business/marketing/market
 * Create or update market definition (upsert)
 *
 * Body:
 * - targetMarketDescription: string (optional)
 * - primarySegment: string (optional)
 * - secondarySegment: string (optional)
 * - nichePositioning: string (optional)
 *
 * Security: Protected by withTenantSecurity
 */
export const POST = withTenantSecurity(async (request: Request, context) => {
  try {
    const body = await request.json();
    const {
      targetMarketDescription,
      primarySegment,
      secondarySegment,
      nichePositioning,
    } = body;

    console.log('[Marketing/Market] Upserting for org:', context.workspaceId);
    console.log('[Marketing/Market] User:', context.userId);

    // Check if market definition already exists
    const existing = await db.query.marketDefinitions.findFirst({
      where: eq(marketDefinitions.workspaceId, context.workspaceId),
    });

    let result;

    if (existing) {
      // Update existing
      console.log('[Marketing/Market] Updating existing market definition');
      const [updated] = await db
        .update(marketDefinitions)
        .set({
          targetMarketDescription: targetMarketDescription || existing.targetMarketDescription,
          primarySegment: primarySegment || existing.primarySegment,
          secondarySegment: secondarySegment || existing.secondarySegment,
          nichePositioning: nichePositioning || existing.nichePositioning,
          userId: context.userId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(marketDefinitions.id, existing.id))
        .returning();

      result = updated;
    } else {
      // Create new
      console.log('[Marketing/Market] Creating new market definition');
      const [created] = await db
        .insert(marketDefinitions)
        .values({
          workspaceId: context.workspaceId,
          userId: context.userId,
          targetMarketDescription: targetMarketDescription || null,
          primarySegment: primarySegment || null,
          secondarySegment: secondarySegment || null,
          nichePositioning: nichePositioning || null,
        })
        .returning();

      result = created;
    }

    console.log('[Marketing/Market] ✅ Saved successfully');

    return NextResponse.json({
      success: true,
      marketDefinition: result,
      message: existing ? 'Market definition updated' : 'Market definition created',
    });
  } catch (error) {
    console.error('[Marketing/Market] Error saving:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save market definition',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

import { NextResponse } from 'next/server';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { ads } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * POST /api/ads
 * Save AI-generated ad variation(s) to database
 *
 * Body:
 * - variations: Array of { formula, hook, full_copy, cta, word_count }
 * - landing_page: string
 * - ad_type: 'meta' | 'google'
 *
 * Security: Protected by withTenantSecurity
 */
export const POST = withTenantSecurity(async (request: Request, context) => {
  try {
    const body = await request.json();
    const { variations, landing_page, ad_type = 'meta' } = body;

    // Validation
    if (!variations || !Array.isArray(variations) || variations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Variations array is required' },
        { status: 400 }
      );
    }

    // Insert all variations
    const savedAds = [];
    for (const variation of variations) {
      const [saved] = await db.insert(ads).values({
        organizationId: context.organizationId,
        userId: context.userId,
        ai_generated: true,
        ai_prompt: variation.formula,
        status: 'draft',
        ad_type,
        headline: variation.hook,
        body_text: variation.full_copy,
        call_to_action: variation.cta,
        landing_page,
        word_count: variation.word_count,
        platform_ad_id: null,
      }).returning();

      savedAds.push(saved);
    }

    return NextResponse.json({
      success: true,
      data: savedAds,
      message: `Successfully saved ${savedAds.length} ad variation${savedAds.length > 1 ? 's' : ''}`,
    });

  } catch (error) {
    console.error('Error saving ads:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});

/**
 * GET /api/ads
 * List saved ads with filters
 *
 * Query params:
 * - platform: 'meta' | 'google'
 * - formula: 'PASTOR' | 'Story-Bridge' | 'Social Proof'
 * - status: 'draft' | 'active' | 'paused' | 'archived'
 * - search: string (searches headline, body_text, landing_page)
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 *
 * Security: Protected by withTenantSecurity
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    const { searchParams } = new URL(request.url);

    // Build WHERE conditions (always filter by organization)
    const conditions = [eq(ads.organizationId, context.organizationId)];

    // Filter by platform
    const platform = searchParams.get('platform');
    if (platform) {
      conditions.push(eq(ads.ad_type, platform));
    }

    // Filter by formula (ai_prompt)
    const formula = searchParams.get('formula');
    if (formula) {
      conditions.push(eq(ads.ai_prompt, formula));
    }

    // Filter by status
    const status = searchParams.get('status');
    if (status) {
      conditions.push(eq(ads.status, status));
    }

    // Search filter (handled in JS after query for simplicity)
    const search = searchParams.get('search');

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Query ads with user relation
    let results = await db.query.ads.findMany({
      where: and(...conditions),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [desc(ads.createdAt)],
      limit,
      offset,
    });

    // Apply search filter in memory (for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(ad =>
        ad.headline.toLowerCase().includes(searchLower) ||
        ad.body_text.toLowerCase().includes(searchLower) ||
        (ad.landing_page && ad.landing_page.toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length,
      filters: {
        platform,
        formula,
        status,
        search,
      },
    });

  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});

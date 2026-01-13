import { NextResponse } from 'next/server';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { customerAvatars } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * GET /api/business/marketing/avatars
 * Fetch avatar sets from Marketing Command Center (READ-ONLY)
 *
 * This queries the existing customerAvatars table and groups by setName
 * to show avatar sets available for the organization.
 *
 * Security: Protected by withTenantSecurity
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    console.log('[Marketing/Avatars] Fetching avatar sets for org:', context.workspaceId);

    // Query avatar sets grouped by setName
    const avatarSets = await db
      .select({
        setName: customerAvatars.setName,
        niche: customerAvatars.niche,
        description: customerAvatars.description,
        avatarCount: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(customerAvatars)
      .where(
        and(
          eq(customerAvatars.workspaceId, context.workspaceId),
          eq(customerAvatars.isActive, true)
        )
      )
      .groupBy(
        customerAvatars.setName,
        customerAvatars.niche,
        customerAvatars.description
      );

    console.log('[Marketing/Avatars] Found', avatarSets.length, 'avatar sets');

    return NextResponse.json({
      success: true,
      avatarSets,
      count: avatarSets.length,
      message: avatarSets.length === 0
        ? 'No avatar sets found. Create them in Marketing Command Center.'
        : undefined,
    });
  } catch (error) {
    console.error('[Marketing/Avatars] Error fetching:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch avatar sets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

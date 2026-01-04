import { NextResponse } from 'next/server';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { userPrinciples } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/business/congruence/principles
 * Fetch user principles for the CURRENT USER ONLY (user-private)
 *
 * Security: USER-PRIVATE - only returns this user's principles
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    console.log('[Principles] Fetching for user:', context.userId);

    // CRITICAL: Filter by BOTH organizationId AND userId for privacy
    const principles = await db
      .select()
      .from(userPrinciples)
      .where(
        and(
          eq(userPrinciples.organizationId, context.organizationId),
          eq(userPrinciples.userId, context.userId) // USER-PRIVATE!
        )
      )
      .limit(1);

    return NextResponse.json({
      success: true,
      principles: principles[0] || null,
    });
  } catch (error) {
    console.error('[Principles] Error fetching:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch principles',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/business/congruence/principles
 * Create or update user principles for the current user
 *
 * Security: USER-PRIVATE - creates/updates for current user only
 */
export const POST = withTenantSecurity(async (request: Request, context) => {
  try {
    const body = await request.json();

    console.log('[Principles] Saving for user:', context.userId);

    // Check if principles exist for this user
    const existing = await db
      .select()
      .from(userPrinciples)
      .where(
        and(
          eq(userPrinciples.organizationId, context.organizationId),
          eq(userPrinciples.userId, context.userId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing principles
      const updated = await db
        .update(userPrinciples)
        .set({
          ...body,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userPrinciples.id, existing[0].id))
        .returning();

      console.log('[Principles] Updated principles:', updated[0].id);

      return NextResponse.json({
        success: true,
        principles: updated[0],
      });
    } else {
      // Create new principles
      const created = await db
        .insert(userPrinciples)
        .values({
          organizationId: context.organizationId,
          userId: context.userId,
          isPrivate: true,
          ...body,
        })
        .returning();

      console.log('[Principles] Created principles:', created[0].id);

      return NextResponse.json({
        success: true,
        principles: created[0],
      });
    }
  } catch (error) {
    console.error('[Principles] Error saving:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save principles',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

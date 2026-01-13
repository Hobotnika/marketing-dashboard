import { NextResponse } from 'next/server';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { messageFrameworks, painPoints, usps } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

/**
 * GET /api/business/marketing/message
 * Fetch message framework with pain points and USPs
 *
 * Security: Protected by withTenantSecurity
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    console.log('[Marketing/Message] Fetching for org:', context.workspaceId);

    // Get the message framework
    const framework = await db.query.messageFrameworks.findFirst({
      where: eq(messageFrameworks.workspaceId, context.workspaceId),
    });

    if (!framework) {
      console.log('[Marketing/Message] No framework found');
      return NextResponse.json({
        success: true,
        messageFramework: null,
        painPoints: [],
        usps: [],
      });
    }

    // Get pain points
    const painPointsList = await db.query.painPoints.findMany({
      where: and(
        eq(painPoints.workspaceId, context.workspaceId),
        eq(painPoints.messageFrameworkId, framework.id)
      ),
      orderBy: [asc(painPoints.displayOrder)],
    });

    // Get USPs
    const uspsList = await db.query.usps.findMany({
      where: and(
        eq(usps.workspaceId, context.workspaceId),
        eq(usps.messageFrameworkId, framework.id)
      ),
      orderBy: [asc(usps.displayOrder)],
    });

    console.log('[Marketing/Message] Found framework with', painPointsList.length, 'pain points and', uspsList.length, 'USPs');

    return NextResponse.json({
      success: true,
      messageFramework: framework,
      painPoints: painPointsList,
      usps: uspsList,
    });
  } catch (error) {
    console.error('[Marketing/Message] Error fetching:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch message framework',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/business/marketing/message
 * Create or update message framework (upsert)
 *
 * Body:
 * - valueProposition: string (optional)
 *
 * Security: Protected by withTenantSecurity
 */
export const POST = withTenantSecurity(async (request: Request, context) => {
  try {
    const body = await request.json();
    const { valueProposition } = body;

    console.log('[Marketing/Message] Upserting for org:', context.workspaceId);
    console.log('[Marketing/Message] User:', context.userId);

    // Check if framework already exists
    const existing = await db.query.messageFrameworks.findFirst({
      where: eq(messageFrameworks.workspaceId, context.workspaceId),
    });

    let result;

    if (existing) {
      // Update existing
      console.log('[Marketing/Message] Updating existing framework');
      const [updated] = await db
        .update(messageFrameworks)
        .set({
          valueProposition: valueProposition || existing.valueProposition,
          userId: context.userId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(messageFrameworks.id, existing.id))
        .returning();

      result = updated;
    } else {
      // Create new
      console.log('[Marketing/Message] Creating new framework');
      const [created] = await db
        .insert(messageFrameworks)
        .values({
          workspaceId: context.workspaceId,
          userId: context.userId,
          valueProposition: valueProposition || null,
        })
        .returning();

      result = created;
    }

    console.log('[Marketing/Message] ✅ Saved successfully');

    return NextResponse.json({
      success: true,
      messageFramework: result,
      message: existing ? 'Message framework updated' : 'Message framework created',
    });
  } catch (error) {
    console.error('[Marketing/Message] Error saving:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save message framework',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

import { NextResponse } from 'next/server';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { painPoints, messageFrameworks } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

/**
 * GET /api/business/marketing/pain-points
 * List pain points for the organization
 *
 * Security: Protected by withTenantSecurity
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    console.log('[Marketing/PainPoints] Fetching for org:', context.workspaceId);

    // Get the message framework first
    const framework = await db.query.messageFrameworks.findFirst({
      where: eq(messageFrameworks.workspaceId, context.workspaceId),
    });

    if (!framework) {
      console.log('[Marketing/PainPoints] No framework found');
      return NextResponse.json({
        success: true,
        painPoints: [],
        message: 'No message framework found. Create one first.',
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

    console.log('[Marketing/PainPoints] Found', painPointsList.length, 'pain points');

    return NextResponse.json({
      success: true,
      painPoints: painPointsList,
    });
  } catch (error) {
    console.error('[Marketing/PainPoints] Error fetching:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pain points',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/business/marketing/pain-points
 * Add a new pain point
 *
 * Body:
 * - description: string (required)
 * - displayOrder: number (optional, defaults to 0)
 *
 * Security: Protected by withTenantSecurity
 */
export const POST = withTenantSecurity(async (request: Request, context) => {
  try {
    const body = await request.json();
    const { description, displayOrder } = body;

    // Validation
    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }

    console.log('[Marketing/PainPoints] Creating for org:', context.workspaceId);

    // Get or create message framework
    let framework = await db.query.messageFrameworks.findFirst({
      where: eq(messageFrameworks.workspaceId, context.workspaceId),
    });

    if (!framework) {
      // Create framework if it doesn't exist
      console.log('[Marketing/PainPoints] Creating message framework first');
      const [created] = await db
        .insert(messageFrameworks)
        .values({
          workspaceId: context.workspaceId,
          userId: context.userId,
        })
        .returning();

      framework = created;
    }

    // Create pain point
    const [newPainPoint] = await db
      .insert(painPoints)
      .values({
        workspaceId: context.workspaceId,
        messageFrameworkId: framework.id,
        description,
        displayOrder: displayOrder || 0,
      })
      .returning();

    console.log('[Marketing/PainPoints] ✅ Created successfully');

    return NextResponse.json({
      success: true,
      painPoint: newPainPoint,
      message: 'Pain point created successfully',
    });
  } catch (error) {
    console.error('[Marketing/PainPoints] Error creating:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create pain point',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/business/marketing/pain-points
 * Delete a pain point
 *
 * Query params:
 * - id: string (required) - ID of pain point to delete
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

    console.log('[Marketing/PainPoints] Deleting ID:', id);
    console.log('[Marketing/PainPoints] Organization:', context.workspaceId);

    // Delete pain point (with organization check for security)
    const result = await db
      .delete(painPoints)
      .where(
        and(
          eq(painPoints.id, id),
          eq(painPoints.workspaceId, context.workspaceId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pain point not found or access denied' },
        { status: 404 }
      );
    }

    console.log('[Marketing/PainPoints] ✅ Deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Pain point deleted successfully',
    });
  } catch (error) {
    console.error('[Marketing/PainPoints] Error deleting:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete pain point',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

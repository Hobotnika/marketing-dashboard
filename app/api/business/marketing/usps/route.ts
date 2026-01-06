import { NextResponse } from 'next/server';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { usps, messageFrameworks } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

/**
 * GET /api/business/marketing/usps
 * List USPs for the organization
 *
 * Security: Protected by withTenantSecurity
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    console.log('[Marketing/USPs] Fetching for org:', context.organizationId);

    // Get the message framework first
    const framework = await db.query.messageFrameworks.findFirst({
      where: eq(messageFrameworks.organizationId, context.organizationId),
    });

    if (!framework) {
      console.log('[Marketing/USPs] No framework found');
      return NextResponse.json({
        success: true,
        usps: [],
        message: 'No message framework found. Create one first.',
      });
    }

    // Get USPs
    const uspsList = await db.query.usps.findMany({
      where: and(
        eq(usps.organizationId, context.organizationId),
        eq(usps.messageFrameworkId, framework.id)
      ),
      orderBy: [asc(usps.displayOrder)],
    });

    console.log('[Marketing/USPs] Found', uspsList.length, 'USPs');

    return NextResponse.json({
      success: true,
      usps: uspsList,
    });
  } catch (error) {
    console.error('[Marketing/USPs] Error fetching:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch USPs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/business/marketing/usps
 * Add a new USP
 *
 * Body:
 * - title: string (required)
 * - description: string (required)
 * - displayOrder: number (optional, defaults to 0)
 *
 * Security: Protected by withTenantSecurity
 */
export const POST = withTenantSecurity(async (request: Request, context) => {
  try {
    const body = await request.json();
    const { title, description, displayOrder } = body;

    // Validation
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }

    console.log('[Marketing/USPs] Creating for org:', context.organizationId);

    // Get or create message framework
    let framework = await db.query.messageFrameworks.findFirst({
      where: eq(messageFrameworks.organizationId, context.organizationId),
    });

    if (!framework) {
      // Create framework if it doesn't exist
      console.log('[Marketing/USPs] Creating message framework first');
      const [created] = await db
        .insert(messageFrameworks)
        .values({
          organizationId: context.organizationId,
          userId: context.userId,
        })
        .returning();

      framework = created;
    }

    // Create USP
    const [newUsp] = await db
      .insert(usps)
      .values({
        organizationId: context.organizationId,
        messageFrameworkId: framework.id,
        title,
        description,
        displayOrder: displayOrder || 0,
      })
      .returning();

    console.log('[Marketing/USPs] ✅ Created successfully');

    return NextResponse.json({
      success: true,
      usp: newUsp,
      message: 'USP created successfully',
    });
  } catch (error) {
    console.error('[Marketing/USPs] Error creating:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create USP',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/business/marketing/usps
 * Delete a USP
 *
 * Query params:
 * - id: string (required) - ID of USP to delete
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

    console.log('[Marketing/USPs] Deleting ID:', id);
    console.log('[Marketing/USPs] Organization:', context.organizationId);

    // Delete USP (with organization check for security)
    const result = await db
      .delete(usps)
      .where(
        and(
          eq(usps.id, id),
          eq(usps.organizationId, context.organizationId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'USP not found or access denied' },
        { status: 404 }
      );
    }

    console.log('[Marketing/USPs] ✅ Deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'USP deleted successfully',
    });
  } catch (error) {
    console.error('[Marketing/USPs] Error deleting:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete USP',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

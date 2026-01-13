import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { dmScripts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/business/scripts/[id]
 * Get a single script by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const { id } = params;

    const script = await db.query.dmScripts.findFirst({
      where: and(
        eq(dmScripts.id, id),
        eq(dmScripts.workspaceId, context.workspaceId)
      ),
    });

    if (!script) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      script,
    });
  } catch (error) {
    console.error('Error fetching script:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch script' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/business/scripts/[id]
 * Update a script
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const { id } = params;
    const body = await request.json();

    // Check if script exists and belongs to organization
    const existingScript = await db.query.dmScripts.findFirst({
      where: and(
        eq(dmScripts.id, id),
        eq(dmScripts.workspaceId, context.workspaceId)
      ),
    });

    if (!existingScript) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only update fields that are provided
    if (body.title !== undefined) updateData.title = body.title;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.useCase !== undefined) updateData.useCase = body.useCase;
    if (body.talkingPoints !== undefined) updateData.talkingPoints = body.talkingPoints;
    if (body.expectedOutcomes !== undefined) updateData.expectedOutcomes = body.expectedOutcomes;
    if (body.successTips !== undefined) updateData.successTips = body.successTips;
    if (body.order !== undefined) updateData.order = body.order;

    const updatedScript = await db
      .update(dmScripts)
      .set(updateData)
      .where(
        and(
          eq(dmScripts.id, id),
          eq(dmScripts.workspaceId, context.workspaceId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      script: updatedScript[0],
    });
  } catch (error) {
    console.error('Error updating script:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update script' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/scripts/[id]
 * Delete a script (unless it's a default template)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const { id } = params;

    // Check if script exists and belongs to organization
    const existingScript = await db.query.dmScripts.findFirst({
      where: and(
        eq(dmScripts.id, id),
        eq(dmScripts.workspaceId, context.workspaceId)
      ),
    });

    if (!existingScript) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of default templates
    if (existingScript.isDefaultTemplate) {
      return NextResponse.json(
        { error: 'Cannot delete default templates' },
        { status: 400 }
      );
    }

    await db
      .delete(dmScripts)
      .where(
        and(
          eq(dmScripts.id, id),
          eq(dmScripts.workspaceId, context.workspaceId)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Script deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting script:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete script' },
      { status: 500 }
    );
  }
}

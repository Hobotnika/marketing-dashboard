import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { quarterlyOKRs, keyResults } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/business/planning/okrs/[id]
 * Get a single OKR with its key results (company-level)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const okrId = params.id;

    // Fetch OKR (company-level)
    const okr = await db
      .select()
      .from(quarterlyOKRs)
      .where(
        and(
          eq(quarterlyOKRs.id, okrId),
          eq(quarterlyOKRs.organizationId, context.organizationId)
        )
      )
      .limit(1);

    if (okr.length === 0) {
      return NextResponse.json(
        { error: 'OKR not found' },
        { status: 404 }
      );
    }

    // Fetch key results
    const results = await db
      .select()
      .from(keyResults)
      .where(eq(keyResults.okrId, okrId))
      .orderBy(keyResults.createdAt);

    return NextResponse.json({
      success: true,
      okr: {
        ...okr[0],
        keyResults: results,
      },
    });
  } catch (error) {
    console.error('Error fetching OKR:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch OKR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/business/planning/okrs/[id]
 * Update an OKR (company-level)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const okrId = params.id;

    const body = await request.json();
    const {
      objectiveTitle,
      objectiveDescription,
      ownerId,
      status,
    } = body;

    // Verify existence (company-level)
    const existing = await db
      .select()
      .from(quarterlyOKRs)
      .where(
        and(
          eq(quarterlyOKRs.id, okrId),
          eq(quarterlyOKRs.organizationId, context.organizationId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'OKR not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (objectiveTitle !== undefined) updateData.objectiveTitle = objectiveTitle;
    if (objectiveDescription !== undefined) updateData.objectiveDescription = objectiveDescription;
    if (ownerId !== undefined) updateData.ownerId = ownerId;
    if (status !== undefined) updateData.status = status;

    const updated = await db
      .update(quarterlyOKRs)
      .set(updateData)
      .where(
        and(
          eq(quarterlyOKRs.id, okrId),
          eq(quarterlyOKRs.organizationId, context.organizationId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      okr: updated[0],
    });
  } catch (error) {
    console.error('Error updating OKR:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update OKR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/planning/okrs/[id]
 * Delete an OKR and its key results (company-level)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const okrId = params.id;

    // Verify existence (company-level)
    const existing = await db
      .select()
      .from(quarterlyOKRs)
      .where(
        and(
          eq(quarterlyOKRs.id, okrId),
          eq(quarterlyOKRs.organizationId, context.organizationId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'OKR not found' },
        { status: 404 }
      );
    }

    // Delete key results first (cascade should handle this, but being explicit)
    await db
      .delete(keyResults)
      .where(eq(keyResults.okrId, okrId));

    // Delete OKR
    await db
      .delete(quarterlyOKRs)
      .where(
        and(
          eq(quarterlyOKRs.id, okrId),
          eq(quarterlyOKRs.organizationId, context.organizationId)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'OKR deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting OKR:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete OKR' },
      { status: 500 }
    );
  }
}

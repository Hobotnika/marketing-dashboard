import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { quarterlyOKRs, keyResults } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/business/planning/okrs/[id]/key-results
 * Add a new key result to an OKR
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const okrId = params.id;

    const body = await request.json();
    const {
      keyResultTitle,
      targetValue,
      currentValue,
      unit,
    } = body;

    // Validation
    if (!keyResultTitle) {
      return NextResponse.json(
        { error: 'Key result title is required' },
        { status: 400 }
      );
    }

    // Verify OKR exists and belongs to org
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

    // Calculate initial progress percentage
    let progressPercentage = '0.00';
    if (targetValue && currentValue) {
      const target = parseFloat(targetValue);
      const current = parseFloat(currentValue);
      if (target > 0) {
        progressPercentage = ((current / target) * 100).toFixed(2);
      }
    }

    const newKeyResult = await db
      .insert(keyResults)
      .values({
        okrId,
        organizationId: context.organizationId,
        keyResultTitle,
        targetValue: targetValue || null,
        currentValue: currentValue || '0',
        unit: unit || null,
        progressPercentage,
      })
      .returning();

    return NextResponse.json({
      success: true,
      keyResult: newKeyResult[0],
    });
  } catch (error) {
    console.error('Error creating key result:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create key result' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/business/planning/okrs/[id]/key-results
 * Update a key result's progress (requires keyResultId in body)
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
      keyResultId,
      currentValue,
      keyResultTitle,
      targetValue,
      unit,
    } = body;

    // Validation
    if (!keyResultId) {
      return NextResponse.json(
        { error: 'Key result ID is required' },
        { status: 400 }
      );
    }

    // Verify key result exists and belongs to this OKR
    const existing = await db
      .select()
      .from(keyResults)
      .where(
        and(
          eq(keyResults.id, keyResultId),
          eq(keyResults.okrId, okrId),
          eq(keyResults.organizationId, context.organizationId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Key result not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (keyResultTitle !== undefined) updateData.keyResultTitle = keyResultTitle;
    if (targetValue !== undefined) updateData.targetValue = targetValue;
    if (unit !== undefined) updateData.unit = unit;
    if (currentValue !== undefined) {
      updateData.currentValue = currentValue;

      // Recalculate progress percentage
      const target = parseFloat(targetValue !== undefined ? targetValue : existing[0].targetValue || '0');
      const current = parseFloat(currentValue);
      if (target > 0) {
        updateData.progressPercentage = ((current / target) * 100).toFixed(2);
      } else {
        updateData.progressPercentage = '0.00';
      }
    }

    const updated = await db
      .update(keyResults)
      .set(updateData)
      .where(
        and(
          eq(keyResults.id, keyResultId),
          eq(keyResults.okrId, okrId),
          eq(keyResults.organizationId, context.organizationId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      keyResult: updated[0],
    });
  } catch (error) {
    console.error('Error updating key result:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update key result' },
      { status: 500 }
    );
  }
}

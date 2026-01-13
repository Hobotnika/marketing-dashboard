import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { visionMilestones, yearlyVisions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/business/planning/vision/milestones
 * List all milestones, optionally filtered by visionId
 * Query params: visionId
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const visionId = searchParams.get('visionId');

    let query = db
      .select()
      .from(visionMilestones)
      .where(eq(visionMilestones.workspaceId, context.workspaceId));

    if (visionId) {
      query = db
        .select()
        .from(visionMilestones)
        .where(
          and(
            eq(visionMilestones.workspaceId, context.workspaceId),
            eq(visionMilestones.visionId, visionId)
          )
        );
    }

    const milestones = await query.orderBy(visionMilestones.targetDate);

    return NextResponse.json({
      success: true,
      milestones,
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/planning/vision/milestones
 * Create a new milestone for a vision
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const {
      visionId,
      milestoneTitle,
      targetDate,
      category,
      description,
    } = body;

    // Validation
    if (!visionId || !milestoneTitle) {
      return NextResponse.json(
        { error: 'Vision ID and milestone title are required' },
        { status: 400 }
      );
    }

    // Verify vision exists and belongs to org
    const vision = await db
      .select()
      .from(yearlyVisions)
      .where(
        and(
          eq(yearlyVisions.id, visionId),
          eq(yearlyVisions.workspaceId, context.workspaceId)
        )
      )
      .limit(1);

    if (vision.length === 0) {
      return NextResponse.json(
        { error: 'Vision not found' },
        { status: 404 }
      );
    }

    const newMilestone = await db
      .insert(visionMilestones)
      .values({
        visionId,
        workspaceId: context.workspaceId,
        milestoneTitle,
        targetDate: targetDate || null,
        category: category || null,
        description: description || null,
        isCompleted: false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      milestone: newMilestone[0],
    });
  } catch (error) {
    console.error('Error creating milestone:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create milestone' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/business/planning/vision/milestones
 * Update a milestone (requires milestoneId in body)
 */
export async function PATCH(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const {
      milestoneId,
      milestoneTitle,
      targetDate,
      category,
      description,
      isCompleted,
      completedAt,
    } = body;

    // Validation
    if (!milestoneId) {
      return NextResponse.json(
        { error: 'Milestone ID is required' },
        { status: 400 }
      );
    }

    // Verify milestone exists and belongs to org
    const existing = await db
      .select()
      .from(visionMilestones)
      .where(
        and(
          eq(visionMilestones.id, milestoneId),
          eq(visionMilestones.workspaceId, context.workspaceId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (milestoneTitle !== undefined) updateData.milestoneTitle = milestoneTitle;
    if (targetDate !== undefined) updateData.targetDate = targetDate;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
    if (completedAt !== undefined) updateData.completedAt = completedAt;

    const updated = await db
      .update(visionMilestones)
      .set(updateData)
      .where(
        and(
          eq(visionMilestones.id, milestoneId),
          eq(visionMilestones.workspaceId, context.workspaceId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      milestone: updated[0],
    });
  } catch (error) {
    console.error('Error updating milestone:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    );
  }
}

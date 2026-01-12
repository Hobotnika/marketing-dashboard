import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { teamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PATCH /api/business/team/members/[id]
 * Update team member (role, department, title)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const body = await request.json();
    const { role, department, title, status } = body;

    // Verify member belongs to organization
    const existingMembers = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.id, params.id),
          eq(teamMembers.organizationId, context.organizationId)
        )
      )
      .limit(1);

    if (existingMembers.length === 0) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Update member
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (role) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (title !== undefined) updateData.title = title;
    if (status) updateData.status = status;

    const updatedMembers = await db
      .update(teamMembers)
      .set(updateData)
      .where(eq(teamMembers.id, params.id))
      .returning();

    return NextResponse.json({
      success: true,
      member: updatedMembers[0],
    });
  } catch (error) {
    console.error('Error updating team member:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/team/members/[id]
 * Remove team member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();

    // Verify member belongs to organization
    const existingMembers = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.id, params.id),
          eq(teamMembers.organizationId, context.organizationId)
        )
      )
      .limit(1);

    if (existingMembers.length === 0) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Delete member
    await db.delete(teamMembers).where(eq(teamMembers.id, params.id));

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    console.error('Error removing team member:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}

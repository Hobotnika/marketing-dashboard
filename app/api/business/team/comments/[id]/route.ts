import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { comments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PATCH /api/business/team/comments/[id]
 * Edit comment
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();
    const body = await request.json();
    const { commentText } = body;

    if (!commentText) {
      return NextResponse.json(
        { error: 'commentText is required' },
        { status: 400 }
      );
    }

    // Verify comment belongs to user
    const existingComments = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.id, params.id),
          eq(comments.userId, context.userId),
          eq(comments.organizationId, context.organizationId)
        )
      )
      .limit(1);

    if (existingComments.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update comment
    const updatedComments = await db
      .update(comments)
      .set({
        commentText,
        isEdited: true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(comments.id, params.id))
      .returning();

    return NextResponse.json({
      success: true,
      comment: updatedComments[0],
    });
  } catch (error) {
    console.error('Error updating comment:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/team/comments/[id]
 * Remove comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await protectTenantRoute();

    // Verify comment belongs to user
    const existingComments = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.id, params.id),
          eq(comments.userId, context.userId),
          eq(comments.organizationId, context.organizationId)
        )
      )
      .limit(1);

    if (existingComments.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete comment
    await db.delete(comments).where(eq(comments.id, params.id));

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

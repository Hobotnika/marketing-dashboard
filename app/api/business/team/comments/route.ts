import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { comments, users, notifications } from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

/**
 * GET /api/business/team/comments
 * Fetch comments for an entity (entityType + entityId)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    // Fetch comments with user info
    const commentList = await db
      .select({
        id: comments.id,
        commentText: comments.commentText,
        mentions: comments.mentions,
        parentCommentId: comments.parentCommentId,
        isEdited: comments.isEdited,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        userId: comments.userId,
        userName: users.name,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(
        and(
          eq(comments.entityType, entityType),
          eq(comments.entityId, entityId),
          eq(comments.workspaceId, context.workspaceId)
        )
      )
      .orderBy(desc(comments.createdAt));

    return NextResponse.json({
      success: true,
      comments: commentList,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/team/comments
 * Add comment (with mention detection)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const { entityType, entityId, commentText, parentCommentId } = body;

    // Validation
    if (!entityType || !entityId || !commentText) {
      return NextResponse.json(
        { error: 'entityType, entityId, and commentText are required' },
        { status: 400 }
      );
    }

    // Detect mentions (@username or @userId)
    const mentionRegex = /@(\w+)/g;
    const mentionMatches = commentText.match(mentionRegex) || [];
    const mentions = mentionMatches.map((m: string) => m.substring(1)); // Remove @ symbol

    const newComments = await db
      .insert(comments)
      .values({
        workspaceId: context.workspaceId,
        userId: context.userId,
        entityType,
        entityId,
        commentText,
        mentions: mentions.length > 0 ? JSON.stringify(mentions) : null,
        parentCommentId: parentCommentId || null,
        isEdited: false,
      })
      .returning();

    // Create notifications for mentioned users
    if (mentions.length > 0) {
      // Find user IDs for mentioned usernames
      const mentionedUsers = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(
          and(
            eq(users.workspaceId, context.workspaceId),
            inArray(users.name, mentions)
          )
        );

      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser.id !== context.userId) {
          await db.insert(notifications).values({
            workspaceId: context.workspaceId,
            userId: mentionedUser.id,
            notificationType: 'mention',
            title: 'You were mentioned in a comment',
            message: commentText.substring(0, 100),
            link: `/dashboard/team?entityType=${entityType}&entityId=${entityId}`,
            isRead: false,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      comment: newComments[0],
    });
  } catch (error) {
    console.error('Error creating comment:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

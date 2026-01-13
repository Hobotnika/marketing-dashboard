import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { teamMembers, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/business/team/members
 * List team members
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const members = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        role: teamMembers.role,
        department: teamMembers.department,
        title: teamMembers.title,
        status: teamMembers.status,
        joinedAt: teamMembers.joinedAt,
        invitedAt: teamMembers.invitedAt,
        createdAt: teamMembers.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(teamMembers)
      .leftJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.workspaceId, context.workspaceId));

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error('Error fetching team members:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/team/members
 * Invite team member (creates pending invitation)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const { email, role, department, title } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let userId: string;

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;

      // Check if already a member
      const existingMembers = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.userId, userId),
            eq(teamMembers.workspaceId, context.workspaceId)
          )
        )
        .limit(1);

      if (existingMembers.length > 0) {
        return NextResponse.json(
          { error: 'User is already a team member' },
          { status: 400 }
        );
      }
    } else {
      // Create placeholder user (pending invitation)
      const newUsers = await db
        .insert(users)
        .values({
          email,
          name: email.split('@')[0], // Temporary name
          passwordHash: '', // Will be set when they accept invitation
          workspaceId: context.workspaceId,
          role: 'viewer',
        })
        .returning();

      userId = newUsers[0].id;
    }

    // Create team member record
    const newMembers = await db
      .insert(teamMembers)
      .values({
        workspaceId: context.workspaceId,
        userId,
        role: role || 'member',
        department: department || null,
        title: title || null,
        status: 'pending_invitation',
        invitedBy: context.userId,
        invitedAt: new Date().toISOString(),
      })
      .returning();

    // TODO: Send invitation email (future enhancement)

    return NextResponse.json({
      success: true,
      member: newMembers[0],
    });
  } catch (error) {
    console.error('Error inviting team member:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to invite team member' },
      { status: 500 }
    );
  }
}

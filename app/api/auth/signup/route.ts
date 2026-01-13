import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, workspaces, userWorkspaces } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate subdomain from name (lowercase, no spaces, alphanumeric only)
    const baseSubdomain = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const subdomain = `${baseSubdomain}-${randomSuffix}`;

    const now = new Date().toISOString();
    const workspaceId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const userWorkspaceId = crypto.randomUUID();

    // Create workspace for this user
    const [workspace] = await db
      .insert(workspaces)
      .values({
        id: workspaceId,
        name: `${name}'s Workspace`,
        subdomain: subdomain,
        ownerId: userId, // Will be the user we create next
        status: 'trial',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!workspace) {
      return NextResponse.json(
        { error: 'Failed to create workspace' },
        { status: 500 }
      );
    }

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        name,
        email: email.toLowerCase(),
        passwordHash,
        currentWorkspaceId: workspaceId, // Set their current workspace
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!user) {
      // Rollback: delete the workspace if user creation fails
      await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create userWorkspace relationship (user is owner of their workspace)
    const [userWorkspace] = await db
      .insert(userWorkspaces)
      .values({
        id: userWorkspaceId,
        userId: user.id,
        workspaceId: workspace.id,
        role: 'owner',
        invitedAt: now,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!userWorkspace) {
      // Rollback: delete user and workspace if relationship creation fails
      await db.delete(users).where(eq(users.id, user.id));
      await db.delete(workspaces).where(eq(workspaces.id, workspace.id));
      return NextResponse.json(
        { error: 'Failed to create workspace membership' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        workspace: {
          id: workspace.id,
          name: workspace.name,
          subdomain: workspace.subdomain,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating your account' },
      { status: 500 }
    );
  }
}

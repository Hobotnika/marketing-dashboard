import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { workspaces, userWorkspaces } from '@/lib/db/schema';

/**
 * POST /api/workspaces
 * Creates a new workspace for the user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, subdomain } = await req.json();

    if (!name || !subdomain) {
      return NextResponse.json(
        { error: 'Name and subdomain are required' },
        { status: 400 }
      );
    }

    // Validate subdomain format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return NextResponse.json(
        { error: 'Subdomain must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Check if subdomain is already taken
    const existingWorkspace = await db.query.workspaces.findFirst({
      where: (workspaces, { eq }) => eq(workspaces.subdomain, subdomain),
    });

    if (existingWorkspace) {
      return NextResponse.json(
        { error: 'This subdomain is already taken' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const workspaceId = crypto.randomUUID();
    const userWorkspaceId = crypto.randomUUID();

    // Create the workspace
    await db.insert(workspaces).values({
      id: workspaceId,
      name,
      subdomain,
      ownerId: session.user.id,
      status: 'trial',
      createdAt: now,
      updatedAt: now,
    });

    // Add the user as owner of the workspace
    await db.insert(userWorkspaces).values({
      id: userWorkspaceId,
      userId: session.user.id,
      workspaceId,
      role: 'owner',
      invitedAt: now,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspaceId,
        name,
        subdomain,
        role: 'owner',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspaces
 * Gets all workspaces for the current user
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all workspaces the user has access to
    const userWorkspacesList = await db.query.userWorkspaces.findMany({
      where: (userWorkspaces, { eq }) => eq(userWorkspaces.userId, session.user.id),
      with: {
        workspace: true,
      },
    });

    const workspacesList = userWorkspacesList.map(uw => ({
      id: uw.workspace.id,
      name: uw.workspace.name,
      subdomain: uw.workspace.subdomain,
      role: uw.role,
      isOwner: uw.role === 'owner',
      status: uw.workspace.status,
      createdAt: uw.workspace.createdAt,
    }));

    return NextResponse.json({
      workspaces: workspacesList,
      total: workspacesList.length,
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

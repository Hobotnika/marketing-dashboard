import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, userWorkspaces, workspaces } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/workspaces/switch
 * Switches the user's current workspace
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Verify user has access to this workspace
    const userWorkspace = await db.query.userWorkspaces.findFirst({
      where: and(
        eq(userWorkspaces.userId, session.user.id),
        eq(userWorkspaces.workspaceId, workspaceId)
      ),
      with: {
        workspace: true,
      },
    });

    if (!userWorkspace) {
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 }
      );
    }

    // Update user's currentWorkspaceId
    await db
      .update(users)
      .set({
        currentWorkspaceId: workspaceId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      workspace: {
        id: userWorkspace.workspace.id,
        name: userWorkspace.workspace.name,
        subdomain: userWorkspace.workspace.subdomain,
        role: userWorkspace.role,
      },
    });
  } catch (error) {
    console.error('Error switching workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspaces/switch
 * Gets the list of workspaces the user has access to
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all workspaces the user has access to
    const userWorkspacesList = await db.query.userWorkspaces.findMany({
      where: eq(userWorkspaces.userId, session.user.id),
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
    }));

    // Get current workspace
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    return NextResponse.json({
      workspaces: workspacesList,
      currentWorkspaceId: currentUser?.currentWorkspaceId || null,
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

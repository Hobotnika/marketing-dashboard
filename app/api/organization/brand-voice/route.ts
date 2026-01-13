import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { parseBrandVoice, stringifyBrandVoice, validateBrandVoice, type BrandVoiceProfile } from '@/lib/utils/brand-voice';

/**
 * GET /api/organization/brand-voice
 * Fetch the workspace's brand voice profile
 */
export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.headers.get('x-workspace-id');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID not found' },
        { status: 400 }
      );
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      );
    }

    const brandVoice = parseBrandVoice(workspace.brandVoiceProfile);

    return NextResponse.json({
      success: true,
      data: brandVoice,
    });
  } catch (error) {
    console.error('Error fetching brand voice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brand voice' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organization/brand-voice
 * Update the workspace's brand voice profile
 */
export async function PUT(request: NextRequest) {
  try {
    const workspaceId = request.headers.get('x-workspace-id');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID not found' },
        { status: 400 }
      );
    }

    const brandVoice: BrandVoiceProfile = await request.json();

    // Validate brand voice
    const validation = validateBrandVoice(brandVoice);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Update workspace
    await db
      .update(workspaces)
      .set({
        brandVoiceProfile: stringifyBrandVoice(brandVoice),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(workspaces.id, workspaceId));

    return NextResponse.json({
      success: true,
      message: 'Brand voice saved successfully',
    });
  } catch (error) {
    console.error('Error saving brand voice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save brand voice' },
      { status: 500 }
    );
  }
}

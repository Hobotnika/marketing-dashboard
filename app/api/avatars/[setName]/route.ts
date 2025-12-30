import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customerAvatars } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * DELETE /api/avatars/[setName]
 * Delete entire avatar set (all avatars with that setName)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ setName: string }> }
) {
  try {
    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID not found' },
        { status: 400 }
      );
    }

    const { setName: rawSetName } = await params;
    const setName = decodeURIComponent(rawSetName);

    // Delete all avatars in this set
    const result = await db
      .delete(customerAvatars)
      .where(
        and(
          eq(customerAvatars.organizationId, organizationId),
          eq(customerAvatars.setName, setName)
        )
      );

    return NextResponse.json({
      success: true,
      message: `Deleted avatar set "${setName}"`,
    });
  } catch (error) {
    console.error('Error deleting avatar set:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete avatar set' },
      { status: 500 }
    );
  }
}

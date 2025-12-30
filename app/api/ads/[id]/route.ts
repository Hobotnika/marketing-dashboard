import { NextResponse } from 'next/server';
import { protectTenantRoute, logApiRequest } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { ads } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/ads/[id]
 * Get single ad by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Manually call protectTenantRoute since we need params
    const context = await protectTenantRoute();

    const ad = await db.query.ads.findFirst({
      where: and(
        eq(ads.id, params.id),
        eq(ads.organizationId, context.organizationId) // Security: tenant check
      ),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!ad) {
      return NextResponse.json(
        { success: false, error: 'Ad not found' },
        { status: 404 }
      );
    }

    // Log successful request
    await logApiRequest({
      userId: context.userId,
      organizationId: context.organizationId,
      apiName: 'ads',
      endpoint: `/api/ads/${params.id}`,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      data: ad,
    });

  } catch (error) {
    console.error('Error fetching ad:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ads/[id]
 * Delete ad by ID
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Manually call protectTenantRoute since we need params
    const context = await protectTenantRoute();

    // Delete with tenant check
    const result = await db.delete(ads)
      .where(and(
        eq(ads.id, params.id),
        eq(ads.organizationId, context.organizationId) // Security: tenant check
      ))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ad not found or access denied' },
        { status: 404 }
      );
    }

    // Log successful request
    await logApiRequest({
      userId: context.userId,
      organizationId: context.organizationId,
      apiName: 'ads',
      endpoint: `/api/ads/${params.id}`,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Ad deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting ad:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ads/[id]
 * Update ad (e.g., change status)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Manually call protectTenantRoute since we need params
    const context = await protectTenantRoute();

    const body = await request.json();

    // Allow updating specific fields
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.status) updateData.status = body.status;
    if (body.platform_ad_id !== undefined) updateData.platform_ad_id = body.platform_ad_id;

    const result = await db.update(ads)
      .set(updateData)
      .where(and(
        eq(ads.id, params.id),
        eq(ads.organizationId, context.organizationId) // Security: tenant check
      ))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ad not found or access denied' },
        { status: 404 }
      );
    }

    // Log successful request
    await logApiRequest({
      userId: context.userId,
      organizationId: context.organizationId,
      apiName: 'ads',
      endpoint: `/api/ads/${params.id}`,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      data: result[0],
    });

  } catch (error) {
    console.error('Error updating ad:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

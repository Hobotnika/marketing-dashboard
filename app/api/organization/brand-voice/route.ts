import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { parseBrandVoice, stringifyBrandVoice, validateBrandVoice, type BrandVoiceProfile } from '@/lib/utils/brand-voice';

/**
 * GET /api/organization/brand-voice
 * Fetch the organization's brand voice profile
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID not found' },
        { status: 400 }
      );
    }

    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    const brandVoice = parseBrandVoice(organization.brandVoiceProfile);

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
 * Update the organization's brand voice profile
 */
export async function PUT(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID not found' },
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

    // Update organization
    await db
      .update(organizations)
      .set({
        brandVoiceProfile: stringifyBrandVoice(brandVoice),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(organizations.id, organizationId));

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

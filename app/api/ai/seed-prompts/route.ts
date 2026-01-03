import { NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { seedDefaultKpisPrompts } from '@/lib/db/seed-prompts';

/**
 * POST /api/ai/seed-prompts
 * Seed default KPIS prompts for the current organization
 */
export async function POST(request: Request) {
  try {
    const context = await protectTenantRoute();

    // Only allow admin users to seed prompts
    if (context.userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 403 }
      );
    }

    await seedDefaultKpisPrompts(
      context.organizationId,
      context.userId
    );

    return NextResponse.json({
      success: true,
      message: 'Default KPIS prompts seeded successfully',
    });
  } catch (error) {
    console.error('Error seeding prompts:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      {
        error: 'Failed to seed prompts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

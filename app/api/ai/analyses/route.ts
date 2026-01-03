import { NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { aiAnalyses } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/ai/analyses
 * Get analysis history for a section
 */
export async function GET(request: Request) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const sectionName = searchParams.get('section');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where clause
    let whereClause = eq(aiAnalyses.organizationId, context.organizationId);

    if (sectionName) {
      whereClause = and(
        whereClause,
        eq(aiAnalyses.sectionName, sectionName)
      ) as any;
    }

    const analyses = await db.query.aiAnalyses.findMany({
      where: whereClause,
      orderBy: [desc(aiAnalyses.createdAt)],
      limit,
      with: {
        user: {
          columns: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('Error fetching analyses:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}

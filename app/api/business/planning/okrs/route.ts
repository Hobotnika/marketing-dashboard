import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { quarterlyOKRs, keyResults } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * GET /api/business/planning/okrs
 * List quarterly OKRs for the organization (company-level)
 * Query params: quarter (Q1-Q4), year (YYYY), status (active/completed/archived)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get('quarter'); // Q1, Q2, Q3, Q4
    const year = searchParams.get('year'); // YYYY
    const status = searchParams.get('status'); // active, completed, archived

    // Build query conditions (company-level: filter by org only)
    let conditions = [eq(quarterlyOKRs.organizationId, context.organizationId)];

    if (quarter) {
      conditions.push(eq(quarterlyOKRs.quarter, quarter));
    }

    if (year) {
      conditions.push(eq(quarterlyOKRs.year, parseInt(year)));
    }

    if (status && status !== 'all') {
      conditions.push(eq(quarterlyOKRs.status, status));
    }

    // Fetch OKRs with their key results
    const okrs = await db
      .select()
      .from(quarterlyOKRs)
      .where(sql`${sql.join(conditions, sql` AND `)}`)
      .orderBy(desc(quarterlyOKRs.year), desc(quarterlyOKRs.quarter));

    // Fetch key results for each OKR
    const okrsWithKeyResults = await Promise.all(
      okrs.map(async (okr) => {
        const results = await db
          .select()
          .from(keyResults)
          .where(eq(keyResults.okrId, okr.id))
          .orderBy(keyResults.createdAt);

        return {
          ...okr,
          keyResults: results,
        };
      })
    );

    return NextResponse.json({
      success: true,
      okrs: okrsWithKeyResults,
    });
  } catch (error) {
    console.error('Error fetching OKRs:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch OKRs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/planning/okrs
 * Create a new quarterly OKR (company-level)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const {
      quarter,
      year,
      objectiveTitle,
      objectiveDescription,
      ownerId,
      status,
      keyResultsData, // Array of key results to create
    } = body;

    // Validation
    if (!quarter || !year || !objectiveTitle) {
      return NextResponse.json(
        { error: 'Quarter, year, and objective title are required' },
        { status: 400 }
      );
    }

    if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter)) {
      return NextResponse.json(
        { error: 'Quarter must be Q1, Q2, Q3, or Q4' },
        { status: 400 }
      );
    }

    // Create OKR
    const newOKR = await db
      .insert(quarterlyOKRs)
      .values({
        organizationId: context.organizationId,
        userId: context.userId, // Creator
        ownerId: ownerId || null,
        quarter,
        year: parseInt(year),
        objectiveTitle,
        objectiveDescription: objectiveDescription || null,
        status: status || 'active',
      })
      .returning();

    // Create key results if provided
    let createdKeyResults = [];
    if (keyResultsData && Array.isArray(keyResultsData) && keyResultsData.length > 0) {
      for (const kr of keyResultsData) {
        const newKR = await db
          .insert(keyResults)
          .values({
            okrId: newOKR[0].id,
            organizationId: context.organizationId,
            keyResultTitle: kr.keyResultTitle,
            targetValue: kr.targetValue || null,
            currentValue: kr.currentValue || '0',
            unit: kr.unit || null,
            progressPercentage: '0.00',
          })
          .returning();

        createdKeyResults.push(newKR[0]);
      }
    }

    return NextResponse.json({
      success: true,
      okr: {
        ...newOKR[0],
        keyResults: createdKeyResults,
      },
    });
  } catch (error) {
    console.error('Error creating OKR:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create OKR' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { yearlyVisions, visionMilestones } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * GET /api/business/planning/vision
 * List yearly visions for the organization (company-level)
 * Query params: year (YYYY)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year'); // YYYY

    // Build query conditions (company-level: filter by org only)
    let conditions = [eq(yearlyVisions.workspaceId, context.workspaceId)];

    if (year) {
      conditions.push(eq(yearlyVisions.year, parseInt(year)));
    }

    // Fetch visions with their milestones
    const visions = await db
      .select()
      .from(yearlyVisions)
      .where(sql`${sql.join(conditions, sql` AND `)}`)
      .orderBy(desc(yearlyVisions.year));

    // Fetch milestones for each vision
    const visionsWithMilestones = await Promise.all(
      visions.map(async (vision) => {
        const milestones = await db
          .select()
          .from(visionMilestones)
          .where(eq(visionMilestones.visionId, vision.id))
          .orderBy(visionMilestones.targetDate);

        return {
          ...vision,
          milestones,
        };
      })
    );

    return NextResponse.json({
      success: true,
      visions: visionsWithMilestones,
    });
  } catch (error) {
    console.error('Error fetching yearly visions:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch visions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/planning/vision
 * Create a new yearly vision (company-level)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const {
      year,
      visionStatement,
      coreGoals,
      revenueTarget,
      teamSize,
      productMilestones,
      personalGrowth,
      milestonesData, // Array of milestones to create
    } = body;

    // Validation
    if (!year || !visionStatement) {
      return NextResponse.json(
        { error: 'Year and vision statement are required' },
        { status: 400 }
      );
    }

    // Create vision
    const newVision = await db
      .insert(yearlyVisions)
      .values({
        workspaceId: context.workspaceId,
        userId: context.userId, // Creator
        year: parseInt(year),
        visionStatement,
        coreGoals: coreGoals || null,
        revenueTarget: revenueTarget || null,
        teamSize: teamSize || null,
        productMilestones: productMilestones || null,
        personalGrowth: personalGrowth || null,
      })
      .returning();

    // Create milestones if provided
    let createdMilestones = [];
    if (milestonesData && Array.isArray(milestonesData) && milestonesData.length > 0) {
      for (const milestone of milestonesData) {
        const newMilestone = await db
          .insert(visionMilestones)
          .values({
            visionId: newVision[0].id,
            workspaceId: context.workspaceId,
            milestoneTitle: milestone.milestoneTitle,
            targetDate: milestone.targetDate || null,
            category: milestone.category || null,
            description: milestone.description || null,
            isCompleted: false,
          })
          .returning();

        createdMilestones.push(newMilestone[0]);
      }
    }

    return NextResponse.json({
      success: true,
      vision: {
        ...newVision[0],
        milestones: createdMilestones,
      },
    });
  } catch (error) {
    console.error('Error creating yearly vision:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create vision' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { kpiSnapshots } from '@/lib/db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

/**
 * GET /api/business/kpis
 * Fetch KPI snapshots for the organization
 *
 * Query params:
 * - days: number (default: 30) - how many days to fetch
 *
 * Security: Protected by withTenantSecurity
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range (YYYY-MM-DD format for SQLite)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    console.log('[KPIs] Fetching snapshots for org:', context.organizationId);
    console.log('[KPIs] Date range:', startDateStr, 'to today');

    // Fetch KPI snapshots for this organization
    const snapshots = await db
      .select()
      .from(kpiSnapshots)
      .where(
        and(
          eq(kpiSnapshots.organizationId, context.organizationId),
          gte(kpiSnapshots.date, startDateStr)
        )
      )
      .orderBy(desc(kpiSnapshots.date))
      .limit(days);

    console.log('[KPIs] Found', snapshots.length, 'snapshots');

    return NextResponse.json({
      success: true,
      snapshots,
      count: snapshots.length,
    });
  } catch (error) {
    console.error('[KPIs] Error fetching:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch KPIs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/business/kpis
 * Add or update KPI entry for a specific date
 *
 * Body:
 * - date: string (YYYY-MM-DD)
 * - exposure: number
 * - leads: number
 * - qualifiedLeads: number
 * - ss1SixBoxes: number
 * - ss1DMs: number
 * - checkIns: number
 * - prescriptionClose: number
 * - closes: number
 * - upsells: number
 * - churn: number
 * - churnReasons: string (optional)
 *
 * Security: Protected by withTenantSecurity
 */
export const POST = withTenantSecurity(async (request: Request, context) => {
  try {
    const body = await request.json();
    const { date, ...metrics } = body;

    // Validation
    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date is required (YYYY-MM-DD format)' },
        { status: 400 }
      );
    }

    console.log('[KPIs] Saving for date:', date);
    console.log('[KPIs] Organization:', context.organizationId);
    console.log('[KPIs] User:', context.userId);

    // Check if entry exists for this organization and date
    const existing = await db
      .select()
      .from(kpiSnapshots)
      .where(
        and(
          eq(kpiSnapshots.organizationId, context.organizationId),
          eq(kpiSnapshots.date, date)
        )
      )
      .limit(1);

    let snapshot;

    if (existing.length > 0) {
      // Update existing entry
      console.log('[KPIs] Updating existing snapshot:', existing[0].id);

      const [updated] = await db
        .update(kpiSnapshots)
        .set({
          exposure: metrics.exposure ?? 0,
          leads: metrics.leads ?? 0,
          qualifiedLeads: metrics.qualifiedLeads ?? 0,
          ss1Total: (metrics.ss1SixBoxes ?? 0) + (metrics.ss1DMs ?? 0),
          ss1SixBoxes: metrics.ss1SixBoxes ?? 0,
          ss1DMs: metrics.ss1DMs ?? 0,
          checkIns: metrics.checkIns ?? 0,
          prescriptionClose: metrics.prescriptionClose ?? 0,
          closes: metrics.closes ?? 0,
          upsells: metrics.upsells ?? 0,
          churn: metrics.churn ?? 0,
          churnReasons: metrics.churnReasons || null,
          userId: context.userId, // Track who updated it
          updatedAt: new Date().toISOString(),
        })
        .where(eq(kpiSnapshots.id, existing[0].id))
        .returning();

      snapshot = updated;
      console.log('[KPIs] ✅ Updated successfully');
    } else {
      // Create new entry
      console.log('[KPIs] Creating new snapshot');

      const [created] = await db
        .insert(kpiSnapshots)
        .values({
          organizationId: context.organizationId,
          userId: context.userId,
          date,
          exposure: metrics.exposure ?? 0,
          leads: metrics.leads ?? 0,
          qualifiedLeads: metrics.qualifiedLeads ?? 0,
          ss1Total: (metrics.ss1SixBoxes ?? 0) + (metrics.ss1DMs ?? 0),
          ss1SixBoxes: metrics.ss1SixBoxes ?? 0,
          ss1DMs: metrics.ss1DMs ?? 0,
          checkIns: metrics.checkIns ?? 0,
          prescriptionClose: metrics.prescriptionClose ?? 0,
          closes: metrics.closes ?? 0,
          upsells: metrics.upsells ?? 0,
          churn: metrics.churn ?? 0,
          churnReasons: metrics.churnReasons || null,
        })
        .returning();

      snapshot = created;
      console.log('[KPIs] ✅ Created successfully');
    }

    return NextResponse.json({
      success: true,
      snapshot,
      message: existing.length > 0 ? 'KPIs updated successfully' : 'KPIs saved successfully',
    });
  } catch (error) {
    console.error('[KPIs] Error saving:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save KPIs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

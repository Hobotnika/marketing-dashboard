import { NextRequest, NextResponse } from 'next/server';
import { getLeadAttribution, getLeadStatusStats } from '@/lib/lead-storage';
import type { LeadFilters } from '@/types/leads';

/**
 * GET /api/leads/attribution
 * Get lead attribution by source
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build filters from query params (excluding source since we're grouping by it)
    const filters: Omit<LeadFilters, 'source'> = {};

    // Status filter
    const status = searchParams.get('status');
    if (status) {
      filters.status = status.split(',') as any;
    }

    // Date range
    const startDate = searchParams.get('startDate');
    if (startDate) {
      filters.startDate = startDate;
    }

    const endDate = searchParams.get('endDate');
    if (endDate) {
      filters.endDate = endDate;
    }

    // Get attribution data
    const attribution = getLeadAttribution(filters);
    const statusStats = getLeadStatusStats(filters);

    return NextResponse.json({
      success: true,
      data: {
        bySource: attribution,
        byStatus: statusStats,
      },
      filters,
    });
  } catch (error) {
    console.error('Error fetching attribution:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

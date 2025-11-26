import { NextRequest, NextResponse } from 'next/server';
import { createLead, getLeads, getLeadCount } from '@/lib/lead-storage';
import type { CreateLeadRequest, LeadFilters } from '@/types/leads';

/**
 * GET /api/leads
 * List leads with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build filters from query params
    const filters: LeadFilters = {};

    // Source filter
    const source = searchParams.get('source');
    if (source) {
      filters.source = source.split(',') as any;
    }

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

    // Search
    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    // Pagination
    const limit = searchParams.get('limit');
    if (limit) {
      filters.limit = parseInt(limit, 10);
    }

    const offset = searchParams.get('offset');
    if (offset) {
      filters.offset = parseInt(offset, 10);
    }

    const leads = getLeads(filters);
    const total = getLeadCount(filters);

    return NextResponse.json({
      success: true,
      data: leads,
      total,
      filters,
    });
  } catch (error) {
    console.error('Error fetching leads:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads
 * Create a new lead
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateLeadRequest = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name is required',
        },
        { status: 400 }
      );
    }

    if (!body.source) {
      return NextResponse.json(
        {
          success: false,
          error: 'Source is required',
        },
        { status: 400 }
      );
    }

    // Create lead
    const lead = createLead(body);

    return NextResponse.json({
      success: true,
      data: lead,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

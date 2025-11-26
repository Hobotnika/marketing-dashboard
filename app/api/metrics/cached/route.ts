import { NextRequest, NextResponse } from 'next/server';
import { readCachedMetrics, getTimeSinceUpdate } from '@/lib/persistent-cache';

export async function GET(request: NextRequest) {
  try {
    const cached = readCachedMetrics();

    if (!cached) {
      return NextResponse.json(
        {
          success: false,
          error: 'No cached data available',
          message: 'Please wait for the first data refresh or trigger a manual refresh',
        },
        { status: 404 }
      );
    }

    const response = {
      success: true,
      data: {
        google: cached.google,
        meta: cached.meta,
        calendly: cached.calendly,
        stripe: cached.stripe,
      },
      timestamp: cached.timestamp,
      timeSinceUpdate: getTimeSinceUpdate(),
      errors: cached.errors,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error reading cached metrics:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

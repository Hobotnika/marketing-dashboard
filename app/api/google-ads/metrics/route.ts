import { NextResponse } from 'next/server';
import { GoogleAdsApi, enums } from 'google-ads-api';
import { GoogleAdsMetrics, GoogleAdsApiResponse } from '@/types/google-ads';
import { getCachedMetrics, setCachedMetrics, getCacheTimestamp } from '@/lib/cache';
import { fetchWithFallback, monitoredFetch } from '@/lib/api-utils';
import cacheManager, { generateCacheKey } from '@/lib/cache-manager';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { decrypt } from '@/lib/db/encryption';

// Initialize Google Ads API client with organization credentials
function getGoogleAdsClient(clientId: string, clientSecret: string) {
  const config = {
    client_id: clientId,
    client_secret: clientSecret,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!, // This stays global
  };

  return new GoogleAdsApi(config);
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Get date range (last 30 days)
function getDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

/**
 * GET /api/google-ads/metrics
 * Fetch Google Ads metrics
 *
 * Security: Protected by withTenantSecurity wrapper
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    // Use validated organization from security context
    const { organization } = context;

    const cacheKey = `google-ads-metrics-${organization.id}`;

    // Check if organization has Google Ads credentials
    if (
      !organization.googleAdsClientId ||
      !organization.googleAdsClientSecret ||
      !organization.googleAdsRefreshToken ||
      !organization.googleAdsCustomerId
    ) {
      console.warn(`⚠️  Google Ads credentials not configured for org ${organization.name}`);

      // Return cached data if available
      const cachedData = getCachedMetrics(cacheKey);
      if (cachedData) {
        const response: GoogleAdsApiResponse = {
          success: true,
          data: cachedData,
          cached: true,
          cachedAt: getCacheTimestamp(cacheKey) || undefined,
        };
        return NextResponse.json(response);
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Google Ads credentials not configured. Please add them in the admin panel.',
        } as GoogleAdsApiResponse,
        { status: 500 }
      );
    }

    // Try to fetch from API
    try {
      // Decrypt organization credentials
      const clientId = decrypt(organization.googleAdsClientId);
      const clientSecret = decrypt(organization.googleAdsClientSecret);
      const refreshToken = decrypt(organization.googleAdsRefreshToken);
      const customerId = organization.googleAdsCustomerId;

      const client = getGoogleAdsClient(clientId, clientSecret);

      // Create customer instance with refresh token
      const customer = client.Customer({
        customer_id: customerId,
        refresh_token: refreshToken,
      });

      const dateRange = getDateRange();

      // Query Google Ads API
      const query = `
        SELECT
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.cost_micros
        FROM campaign
        WHERE segments.date BETWEEN '${dateRange.start}' AND '${dateRange.end}'
      `;

      const results = await customer.query(query);

      // Aggregate metrics
      let totalImpressions = 0;
      let totalClicks = 0;
      let totalCost = 0;
      let totalCtr = 0;
      let recordCount = 0;

      for (const row of results) {
        totalImpressions += Number(row.metrics?.impressions || 0);
        totalClicks += Number(row.metrics?.clicks || 0);
        totalCost += Number(row.metrics?.cost_micros || 0);
        totalCtr += Number(row.metrics?.ctr || 0);
        recordCount++;
      }

      // Calculate average CTR and convert cost from micros to dollars
      const avgCtr = recordCount > 0 ? (totalCtr / recordCount) * 100 : 0;
      const costInDollars = totalCost / 1_000_000; // Convert from micros to dollars

      const metrics: GoogleAdsMetrics = {
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: parseFloat(avgCtr.toFixed(2)),
        spend: parseFloat(costInDollars.toFixed(2)),
        dateRange,
      };

      // Cache the successful result with org-specific key
      setCachedMetrics(metrics, cacheKey);

      const response: GoogleAdsApiResponse = {
        success: true,
        data: metrics,
        cached: false,
      };

      return NextResponse.json(response);
    } catch (apiError: unknown) {
      console.error('Google Ads API Error:', apiError);

      // If API call fails, try to return cached data
      const cachedData = getCachedMetrics(cacheKey);

      if (cachedData) {
        const response: GoogleAdsApiResponse = {
          success: true,
          data: cachedData,
          cached: true,
          cachedAt: getCacheTimestamp(cacheKey) || undefined,
          error: 'Using cached data due to API error',
        };
        return NextResponse.json(response);
      }

      // No cached data available
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch Google Ads metrics: ${errorMessage}`,
        } as GoogleAdsApiResponse,
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Unexpected error:', error);

    // Try to return cached data on error
    const cacheKey = `google-ads-metrics-${context.workspaceId}`;
    const cachedData = getCachedMetrics(cacheKey);

    if (cachedData) {
      const response: GoogleAdsApiResponse = {
        success: true,
        data: cachedData,
        cached: true,
        cachedAt: getCacheTimestamp(cacheKey) || undefined,
        error: 'Using cached data due to unexpected error',
      };
      return NextResponse.json(response);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      } as GoogleAdsApiResponse,
      { status: 500 }
    );
  }
});

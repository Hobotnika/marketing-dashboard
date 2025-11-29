import { NextResponse } from 'next/server';
import type {
  RevenueMetrics,
  StripeCharge,
  StripeListResponse,
} from '@/types/stripe';
import { getCache, setCache } from '@/lib/cache';
import { getOrganizationFromHeaders } from '@/lib/api/get-organization';
import { decrypt } from '@/lib/db/encryption';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// Generate org-specific cache key
const getCacheKey = (orgId: string) => `stripe-revenue-${orgId}`;

/**
 * GET /api/stripe/revenue
 * Fetch revenue metrics from Stripe API
 *
 * Query params:
 * - startDate: YYYY-MM-DD (default: 30 days ago)
 * - endDate: YYYY-MM-DD (default: today)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get date range from query params or default to last 30 days
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('startDate') ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get organization from middleware headers
    const { organization, error } = await getOrganizationFromHeaders();
    if (error) return error;

    // Get organization-specific Stripe credentials
    if (!organization.stripeSecretKey) {
      console.warn(`⚠️  Stripe credentials not configured for org ${organization.name}, using cached data`);
      return returnCachedData(startDate, endDate, organization.id);
    }

    // Decrypt the secret key
    const secretKey = decrypt(organization.stripeSecretKey);

    console.log(`💳 Fetching Stripe revenue from ${startDate} to ${endDate}`);

    // Convert dates to Unix timestamps (Stripe uses seconds, not milliseconds)
    const startTimestamp = Math.floor(new Date(startDate + 'T00:00:00Z').getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate + 'T23:59:59Z').getTime() / 1000);

    // Fetch all successful charges
    const charges = await fetchAllCharges(secretKey, startTimestamp, endTimestamp);
    console.log(`✅ Fetched ${charges.length} Stripe charges`);

    // Calculate metrics
    const metrics = calculateMetrics(charges, startDate, endDate);

    // Cache the results with org-specific key
    setCache(getCacheKey(organization.id), metrics, CACHE_TTL);

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('❌ Stripe API Error:', error);

    // Try to get organization for cache lookup
    try {
      const { organization } = await getOrganizationFromHeaders();
      if (organization) {
        const { searchParams } = new URL(request.url);
        const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
        const startDate = searchParams.get('startDate') ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        return returnCachedData(startDate, endDate, organization.id);
      }
    } catch (e) {
      // Fallback to error response
    }

    return NextResponse.json(
      { error: 'Failed to fetch Stripe data' },
      { status: 500 }
    );
  }
}

/**
 * Fetch all successful charges (handles pagination)
 */
async function fetchAllCharges(
  secretKey: string,
  startTimestamp: number,
  endTimestamp: number
): Promise<StripeCharge[]> {
  const allCharges: StripeCharge[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params = new URLSearchParams({
      limit: '100', // Max results per page
      created: JSON.stringify({
        gte: startTimestamp,
        lte: endTimestamp,
      }),
    });

    if (startingAfter) {
      params.set('starting_after', startingAfter);
    }

    const response = await fetch(
      `${STRIPE_API_BASE}/charges?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stripe API error (${response.status}): ${errorText}`);
    }

    const data: StripeListResponse<StripeCharge> = await response.json();

    // Filter only successful charges
    const successfulCharges = data.data.filter(
      charge => charge.status === 'succeeded' && charge.paid && !charge.refunded
    );

    allCharges.push(...successfulCharges);

    hasMore = data.has_more;
    if (hasMore && data.data.length > 0) {
      startingAfter = data.data[data.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  return allCharges;
}

/**
 * Calculate revenue metrics from charges
 */
function calculateMetrics(
  charges: StripeCharge[],
  startDate: string,
  endDate: string
): RevenueMetrics {
  // Total conversions = number of successful charges
  const totalConversions = charges.length;

  // Total revenue = sum of all charge amounts (convert from cents to dollars)
  const totalRevenue = charges.reduce((sum, charge) => {
    return sum + (charge.amount_captured / 100);
  }, 0);

  // Average order value
  const averageOrderValue = totalConversions > 0
    ? totalRevenue / totalConversions
    : 0;

  // ROAS and profit will be calculated separately when we have ad spend data
  // For now, set to 0 (will be updated in dashboard with real ad spend)
  const roas = 0;
  const profit = 0;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100, // 2 decimal places
    totalConversions,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100, // 2 decimal places
    roas,
    profit,
    dateRange: {
      start: startDate,
      end: endDate,
    },
    lastUpdated: new Date().toISOString(),
    charges,
  };
}

/**
 * Return cached data when API fails or credentials missing
 */
function returnCachedData(startDate: string, endDate: string, organizationId: string) {
  const cached = getCache<RevenueMetrics>(getCacheKey(organizationId));

  if (cached) {
    console.log('✅ Returning cached Stripe revenue data');
    return NextResponse.json({
      ...cached,
      fromCache: true,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    });
  }

  // No cache available, return empty data (NOT an error - show $0 instead)
  console.warn('⚠️  No cached Stripe data available, returning $0 revenue');
  return NextResponse.json({
    totalRevenue: 0,
    totalConversions: 0,
    averageOrderValue: 0,
    roas: 0,
    profit: 0,
    dateRange: {
      start: startDate,
      end: endDate,
    },
    fromCache: false,
    message: 'No Stripe data available. Configure Stripe credentials in admin panel.',
  }, { status: 200 }); // Return 200 to prevent dashboard errors
}

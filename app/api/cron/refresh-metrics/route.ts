import { NextRequest, NextResponse } from 'next/server';
import { writeCachedMetrics } from '@/lib/persistent-cache';
import { detectAnomalies, storeHistoricalMetrics } from '@/lib/anomaly-detector';
import { readAlertSettings } from '@/lib/alert-storage';
import { sendAnomalyNotifications } from '@/lib/notifications';

// Rate limiting - simple in-memory store
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5; // Max 5 requests per hour

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const requests = rateLimitStore.get(identifier) || [];

  // Filter out old requests outside the window
  const recentRequests = requests.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW);

  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }

  // Add current request
  recentRequests.push(now);
  rateLimitStore.set(identifier, recentRequests);

  return true;
}

// Verify authorization
function isAuthorized(request: NextRequest): boolean {
  // Check if it's from Vercel Cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Check for API key
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = process.env.API_SECRET_KEY;

  if (validApiKey && apiKey === validApiKey) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Valid CRON_SECRET or API_SECRET_KEY required',
        },
        { status: 401 }
      );
    }

    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'cron-job';
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
        },
        { status: 429 }
      );
    }

    console.log('[CRON] Starting metrics refresh...');

    const errors: { google?: string; meta?: string; calendly?: string; stripe?: string } = {};
    let googleData = null;
    let metaData = null;
    let calendlyData = null;
    let stripeData = null;

    // Fetch Google Ads metrics
    try {
      console.log('[CRON] Fetching Google Ads metrics...');
      const googleResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/google-ads/metrics`,
        {
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );

      const googleResult = await googleResponse.json();

      if (googleResult.success && googleResult.data) {
        googleData = googleResult.data;
        console.log('[CRON] Google Ads metrics fetched successfully');
      } else {
        errors.google = googleResult.error || 'Failed to fetch Google Ads metrics';
        console.error('[CRON] Google Ads error:', errors.google);
      }
    } catch (error) {
      errors.google = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CRON] Google Ads exception:', error);
    }

    // Fetch Meta Ads metrics
    try {
      console.log('[CRON] Fetching Meta Ads metrics...');
      const metaResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/meta-ads/metrics`,
        {
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );

      const metaResult = await metaResponse.json();

      if (metaResult.success && metaResult.data) {
        metaData = metaResult.data;
        console.log('[CRON] Meta Ads metrics fetched successfully');
      } else {
        errors.meta = metaResult.error || 'Failed to fetch Meta Ads metrics';
        console.error('[CRON] Meta Ads error:', errors.meta);
      }
    } catch (error) {
      errors.meta = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CRON] Meta Ads exception:', error);
    }

    // Fetch Calendly metrics
    try {
      console.log('[CRON] Fetching Calendly metrics...');
      const calendlyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/calendly/events`,
        {
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );

      const calendlyResult = await calendlyResponse.json();

      if (calendlyResult && !calendlyResult.error) {
        calendlyData = calendlyResult;
        console.log('[CRON] Calendly metrics fetched successfully');
      } else {
        errors.calendly = calendlyResult.error || 'Failed to fetch Calendly metrics';
        console.error('[CRON] Calendly error:', errors.calendly);
      }
    } catch (error) {
      errors.calendly = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CRON] Calendly exception:', error);
    }

    // Fetch Stripe revenue metrics
    try {
      console.log('[CRON] Fetching Stripe revenue metrics...');
      const stripeResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stripe/revenue`,
        {
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );

      const stripeResult = await stripeResponse.json();

      if (stripeResult && !stripeResult.error) {
        stripeData = stripeResult;
        console.log('[CRON] Stripe revenue metrics fetched successfully');
      } else {
        errors.stripe = stripeResult.error || 'Failed to fetch Stripe revenue metrics';
        console.error('[CRON] Stripe error:', errors.stripe);
      }
    } catch (error) {
      errors.stripe = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CRON] Stripe exception:', error);
    }

    // Save to persistent cache
    const cachedMetrics = {
      google: googleData,
      meta: metaData,
      calendly: calendlyData,
      stripe: stripeData,
      timestamp: new Date().toISOString(),
      success: googleData !== null || metaData !== null || calendlyData !== null || stripeData !== null,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };

    const saved = writeCachedMetrics(cachedMetrics);

    if (!saved) {
      console.error('[CRON] Failed to save cached metrics');
    }

    // Store historical metrics for anomaly detection
    if (googleData || metaData) {
      console.log('[CRON] Storing historical metrics...');
      storeHistoricalMetrics(googleData, metaData);

      // Detect anomalies
      console.log('[CRON] Checking for anomalies...');
      const alertSettings = readAlertSettings();
      const anomalies = detectAnomalies(googleData, metaData, alertSettings);

      if (anomalies.length > 0) {
        console.log(`[CRON] Detected ${anomalies.length} anomalies`);

        // Send notifications if enabled
        const { notificationChannels, dashboardUrl } = alertSettings;
        const emailEnabled =
          notificationChannels.email.enabled &&
          notificationChannels.email.recipients.length > 0;
        const slackEnabled =
          notificationChannels.slack.enabled &&
          notificationChannels.slack.webhookUrl;

        if (emailEnabled || slackEnabled) {
          console.log('[CRON] Sending anomaly notifications...');
          await sendAnomalyNotifications(
            anomalies,
            emailEnabled ? notificationChannels.email.recipients : [],
            slackEnabled ? notificationChannels.slack.webhookUrl : '',
            dashboardUrl
          );
        }
      } else {
        console.log('[CRON] No anomalies detected');
      }
    }

    const response = {
      success: cachedMetrics.success,
      timestamp: cachedMetrics.timestamp,
      data: {
        google: googleData ? 'fetched' : 'failed',
        meta: metaData ? 'fetched' : 'failed',
        calendly: calendlyData ? 'fetched' : 'failed',
        stripe: stripeData ? 'fetched' : 'failed',
      },
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      cached: saved,
    };

    console.log('[CRON] Metrics refresh completed');

    return NextResponse.json(response);
  } catch (error) {
    console.error('[CRON] Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST endpoint for manual refresh
export async function POST(request: NextRequest) {
  return GET(request);
}

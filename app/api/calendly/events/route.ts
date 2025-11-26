import { NextResponse } from 'next/server';
import type {
  CalendlyMetrics,
  CalendlyEventsResponse,
  CalendlyInviteesResponse,
  CalendlyEvent,
  CalendlyInvitee,
} from '@/types/calendly';
import { getCache, setCache } from '@/lib/cache';

const CALENDLY_API_BASE = 'https://api.calendly.com';
const CACHE_KEY = 'calendly-metrics';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * GET /api/calendly/events
 * Fetch scheduled events from Calendly API
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

    // Check required environment variables
    const accessToken = process.env.CALENDLY_ACCESS_TOKEN;
    const userUri = process.env.CALENDLY_USER_URI;

    if (!accessToken || !userUri) {
      console.warn('⚠️  Calendly credentials not configured, using cached data');
      return returnCachedData(startDate, endDate);
    }

    console.log(`📅 Fetching Calendly events from ${startDate} to ${endDate}`);

    // Fetch scheduled events
    const events = await fetchAllScheduledEvents(accessToken, userUri, startDate, endDate);
    console.log(`✅ Fetched ${events.length} Calendly events`);

    // Fetch invitees for each event to get no-show data
    const invitees = await fetchAllInvitees(accessToken, events);
    console.log(`✅ Fetched ${invitees.length} invitees`);

    // Calculate metrics
    const metrics = calculateMetrics(events, invitees, startDate, endDate);

    // Cache the results
    setCache(CACHE_KEY, metrics, CACHE_TTL);

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('❌ Calendly API Error:', error);

    // Return cached data on error
    const { searchParams } = new URL(request.url);
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('startDate') ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return returnCachedData(startDate, endDate);
  }
}

/**
 * Fetch all scheduled events (handles pagination)
 */
async function fetchAllScheduledEvents(
  accessToken: string,
  userUri: string,
  startDate: string,
  endDate: string
): Promise<CalendlyEvent[]> {
  const allEvents: CalendlyEvent[] = [];
  let nextPageToken: string | undefined;

  // Convert dates to ISO 8601 with time
  const minStartTime = `${startDate}T00:00:00.000Z`;
  const maxStartTime = `${endDate}T23:59:59.999Z`;

  do {
    const params = new URLSearchParams({
      user: userUri,
      min_start_time: minStartTime,
      max_start_time: maxStartTime,
      count: '100', // Max results per page
      status: 'active', // Only active events
    });

    if (nextPageToken) {
      params.set('page_token', nextPageToken);
    }

    const response = await fetch(
      `${CALENDLY_API_BASE}/scheduled_events?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Calendly API error (${response.status}): ${errorText}`);
    }

    const data: CalendlyEventsResponse = await response.json();
    allEvents.push(...data.collection);

    nextPageToken = data.pagination.next_page_token;
  } while (nextPageToken);

  return allEvents;
}

/**
 * Fetch invitees for events to determine no-shows and completions
 */
async function fetchAllInvitees(
  accessToken: string,
  events: CalendlyEvent[]
): Promise<CalendlyInvitee[]> {
  const allInvitees: CalendlyInvitee[] = [];

  // Fetch invitees for each event
  for (const event of events) {
    try {
      const eventUuid = event.uri.split('/').pop();
      const response = await fetch(
        `${CALENDLY_API_BASE}/scheduled_events/${eventUuid}/invitees?count=100`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data: CalendlyInviteesResponse = await response.json();
        allInvitees.push(...data.collection);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to fetch invitees for event ${event.uri}:`, error);
    }
  }

  return allInvitees;
}

/**
 * Calculate metrics from events and invitees
 */
function calculateMetrics(
  events: CalendlyEvent[],
  invitees: CalendlyInvitee[],
  startDate: string,
  endDate: string
): CalendlyMetrics {
  const now = new Date();

  // Total booked = all events
  const totalBooked = events.length;

  // No-shows = invitees with no_show field
  const noShows = invitees.filter(inv => inv.no_show).length;

  // Completed = events in the past that are not canceled and invitee didn't no-show
  const completedEvents = events.filter(event => {
    const eventTime = new Date(event.start_time);
    const isPast = eventTime < now;
    const isActive = event.status === 'active';

    // Check if invitee showed up
    const invitee = invitees.find(inv => inv.event === event.uri);
    const notNoShow = !invitee?.no_show;
    const notCanceled = !invitee?.canceled;

    return isPast && isActive && notNoShow && notCanceled;
  });

  const completed = completedEvents.length;

  // Conversion rate = (completed / totalBooked) * 100
  const conversionRate = totalBooked > 0 ? (completed / totalBooked) * 100 : 0;

  return {
    totalBooked,
    completed,
    noShows,
    conversionRate: Math.round(conversionRate * 100) / 100, // 2 decimal places
    dateRange: {
      start: startDate,
      end: endDate,
    },
    lastUpdated: new Date().toISOString(),
    events,
    invitees,
  };
}

/**
 * Return cached data when API fails
 */
function returnCachedData(startDate: string, endDate: string) {
  const cached = getCache<CalendlyMetrics>(CACHE_KEY);

  if (cached) {
    console.log('✅ Returning cached Calendly data');
    return NextResponse.json({
      ...cached,
      fromCache: true,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    });
  }

  // No cache available, return empty data
  console.warn('⚠️  No cached Calendly data available');
  return NextResponse.json({
    totalBooked: 0,
    completed: 0,
    noShows: 0,
    conversionRate: 0,
    dateRange: {
      start: startDate,
      end: endDate,
    },
    fromCache: false,
    error: 'Calendly API credentials not configured and no cached data available',
  }, { status: 200 }); // Return 200 to prevent dashboard errors
}

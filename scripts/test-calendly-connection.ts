/**
 * Test Calendly API Connection
 *
 * Tests the connection to Calendly API and displays basic metrics.
 *
 * Usage:
 *   npx tsx scripts/test-calendly-connection.ts
 */

const CALENDLY_API_BASE = 'https://api.calendly.com';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testCalendlyConnection() {
  log('\n🧪 Testing Calendly API Connection...\n', colors.cyan);

  // Check environment variables
  const accessToken = process.env.CALENDLY_ACCESS_TOKEN;
  const userUri = process.env.CALENDLY_USER_URI;

  if (!accessToken) {
    log('❌ CALENDLY_ACCESS_TOKEN not found in environment', colors.red);
    log('   Add it to your .env.local file', colors.yellow);
    process.exit(1);
  }

  if (!userUri) {
    log('❌ CALENDLY_USER_URI not found in environment', colors.red);
    log('   Add it to your .env.local file', colors.yellow);
    process.exit(1);
  }

  log('✅ Environment variables loaded', colors.green);
  log(`   User URI: ${userUri.substring(0, 50)}...`, colors.blue);

  try {
    // Test 1: Get user information
    log('\n📝 Test 1: Fetching user information...', colors.cyan);
    const userResponse = await fetch(`${CALENDLY_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      throw new Error(`User API error (${userResponse.status}): ${errorText}`);
    }

    const userData = await userResponse.json();
    log('✅ User data fetched successfully', colors.green);
    log(`   Name: ${userData.resource.name}`, colors.blue);
    log(`   Email: ${userData.resource.email}`, colors.blue);
    log(`   Scheduling URL: ${userData.resource.scheduling_url}`, colors.blue);

    // Test 2: Fetch scheduled events
    log('\n📅 Test 2: Fetching scheduled events...', colors.cyan);

    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const params = new URLSearchParams({
      user: userUri,
      min_start_time: startDate,
      max_start_time: endDate,
      count: '10',
      status: 'active',
    });

    const eventsResponse = await fetch(
      `${CALENDLY_API_BASE}/scheduled_events?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      throw new Error(`Events API error (${eventsResponse.status}): ${errorText}`);
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.collection;

    log('✅ Events fetched successfully', colors.green);
    log(`   Total Events (last 30 days): ${eventsData.pagination.count}`, colors.blue);
    log(`   Events in response: ${events.length}`, colors.blue);

    if (events.length > 0) {
      log('\n📊 Sample Events:', colors.cyan);
      events.slice(0, 3).forEach((event: any, index: number) => {
        log(`   ${index + 1}. ${event.name}`, colors.blue);
        log(`      Start: ${new Date(event.start_time).toLocaleString()}`, colors.blue);
        log(`      Status: ${event.status}`, colors.blue);
        log(`      Invitees: ${event.invitees_counter.active}/${event.invitees_counter.total}`, colors.blue);
      });
    }

    // Test 3: Calculate metrics
    log('\n📈 Test 3: Calculating metrics...', colors.cyan);

    const now = new Date();
    const pastEvents = events.filter((e: any) => new Date(e.start_time) < now);
    const upcomingEvents = events.filter((e: any) => new Date(e.start_time) >= now);

    log('✅ Metrics calculated', colors.green);
    log(`   Total Booked: ${events.length}`, colors.blue);
    log(`   Past Events: ${pastEvents.length}`, colors.blue);
    log(`   Upcoming Events: ${upcomingEvents.length}`, colors.blue);

    // Test 4: Fetch invitees for first event (if available)
    if (events.length > 0) {
      log('\n👥 Test 4: Fetching invitee data...', colors.cyan);
      const firstEvent = events[0];
      const eventUuid = firstEvent.uri.split('/').pop();

      const inviteesResponse = await fetch(
        `${CALENDLY_API_BASE}/scheduled_events/${eventUuid}/invitees`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (inviteesResponse.ok) {
        const inviteesData = await inviteesResponse.json();
        const invitees = inviteesData.collection;

        log('✅ Invitee data fetched', colors.green);
        log(`   Total Invitees: ${invitees.length}`, colors.blue);

        if (invitees.length > 0) {
          const noShows = invitees.filter((inv: any) => inv.no_show).length;
          const canceled = invitees.filter((inv: any) => inv.canceled).length;

          log(`   No-shows: ${noShows}`, colors.blue);
          log(`   Canceled: ${canceled}`, colors.blue);
          log(`   Active: ${invitees.length - noShows - canceled}`, colors.blue);
        }
      } else {
        log('⚠️  Could not fetch invitee data', colors.yellow);
      }
    }

    // Success summary
    log('\n✅ All tests passed!', colors.green);
    log('\n📋 Summary:', colors.cyan);
    log('   ✓ Authentication successful', colors.green);
    log('   ✓ User data accessible', colors.green);
    log('   ✓ Events fetched successfully', colors.green);
    log('   ✓ Metrics calculation working', colors.green);
    log('\n🚀 Your Calendly API integration is ready!', colors.green);

  } catch (error) {
    log('\n❌ Test failed:', colors.red);
    if (error instanceof Error) {
      log(`   ${error.message}`, colors.red);
    } else {
      log(`   ${String(error)}`, colors.red);
    }

    log('\n💡 Troubleshooting:', colors.yellow);
    log('   1. Check your CALENDLY_ACCESS_TOKEN is valid', colors.yellow);
    log('   2. Verify CALENDLY_USER_URI is correct', colors.yellow);
    log('   3. Ensure your Calendly account has API access', colors.yellow);
    log('   4. Check you have scheduled events in your account', colors.yellow);

    process.exit(1);
  }
}

// Run the test
testCalendlyConnection();

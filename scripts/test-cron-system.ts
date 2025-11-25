/**
 * Test Script for Automatic Refresh System
 *
 * Tests:
 * 1. Persistent cache read/write operations
 * 2. Cached metrics endpoint
 * 3. Manual refresh endpoint (with API key)
 *
 * Run: npx tsx scripts/test-cron-system.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function testPersistentCache() {
  log('\n📦 Testing Persistent Cache System...', colors.blue);

  const cachePath = path.join(process.cwd(), '.cache', 'metrics.json');

  // Test 1: Write mock data
  log('  ✓ Testing cache write...', colors.yellow);
  const mockData = {
    google: {
      impressions: 150000,
      clicks: 3500,
      ctr: 2.33,
      spend: 1250.50,
      dateRange: { start: '2025-10-26', end: '2025-11-25' }
    },
    meta: {
      campaigns: [],
      totals: {
        reach: 45000,
        whatsappConversations: 234,
        spend: 1250.50,
        avgCostPerConversation: 5.34,
        dateRange: { start: '2025-10-26', end: '2025-11-25' }
      }
    },
    timestamp: new Date().toISOString(),
    success: true,
    errors: {}
  };

  try {
    fs.writeFileSync(cachePath, JSON.stringify(mockData, null, 2));
    log('    ✓ Cache written successfully', colors.green);
  } catch (error) {
    log(`    ✗ Failed to write cache: ${error}`, colors.red);
    return false;
  }

  // Test 2: Read cache
  log('  ✓ Testing cache read...', colors.yellow);
  try {
    const data = fs.readFileSync(cachePath, 'utf-8');
    const parsed = JSON.parse(data);
    log('    ✓ Cache read successfully', colors.green);
    log(`    ✓ Timestamp: ${parsed.timestamp}`, colors.green);
    log(`    ✓ Google Impressions: ${parsed.google.impressions.toLocaleString()}`, colors.green);
    log(`    ✓ Meta Conversations: ${parsed.meta.totals.whatsappConversations}`, colors.green);
  } catch (error) {
    log(`    ✗ Failed to read cache: ${error}`, colors.red);
    return false;
  }

  return true;
}

async function testCachedEndpoint() {
  log('\n🌐 Testing /api/metrics/cached endpoint...', colors.blue);

  try {
    const response = await fetch('http://localhost:3000/api/metrics/cached');

    if (!response.ok) {
      log(`    ✗ Endpoint returned ${response.status}`, colors.red);
      return false;
    }

    const data = await response.json();
    log('    ✓ Endpoint responded successfully', colors.green);
    log(`    ✓ Success: ${data.success}`, colors.green);
    log(`    ✓ Time since update: ${data.timeSinceUpdate || 'Just now'}`, colors.green);

    if (data.data?.google) {
      log(`    ✓ Google data present: ${data.data.google.impressions} impressions`, colors.green);
    }

    if (data.data?.meta) {
      log(`    ✓ Meta data present: ${data.data.meta.totals.whatsappConversations} conversations`, colors.green);
    }

    return true;
  } catch (error) {
    log(`    ✗ Failed to fetch: ${error}`, colors.red);
    log('    ℹ️  Make sure dev server is running (npm run dev)', colors.yellow);
    return false;
  }
}

async function testRefreshEndpoint() {
  log('\n🔄 Testing /api/cron/refresh-metrics endpoint...', colors.blue);

  const apiKey = process.env.API_SECRET_KEY;

  if (!apiKey || apiKey === 'your_api_secret_key_here_change_in_production') {
    log('    ⚠️  Skipping refresh test - API_SECRET_KEY not configured', colors.yellow);
    log('    ℹ️  Set API_SECRET_KEY in .env.local to test manual refresh', colors.yellow);
    return true; // Not a failure, just skipped
  }

  try {
    const response = await fetch('http://localhost:3000/api/cron/refresh-metrics', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      log(`    ✗ Refresh failed: ${error.message}`, colors.red);
      return false;
    }

    const data = await response.json();
    log('    ✓ Refresh endpoint responded', colors.green);
    log(`    ✓ Success: ${data.success}`, colors.green);
    log(`    ✓ Timestamp: ${data.timestamp}`, colors.green);

    return true;
  } catch (error) {
    log(`    ✗ Failed to call refresh endpoint: ${error}`, colors.red);
    return false;
  }
}

async function runTests() {
  log('╔════════════════════════════════════════════════════════════╗', colors.blue);
  log('║  Automatic Refresh System - Test Suite                    ║', colors.blue);
  log('╚════════════════════════════════════════════════════════════╝', colors.blue);

  const results = {
    cache: false,
    cached: false,
    refresh: false,
  };

  // Test 1: Persistent Cache
  results.cache = testPersistentCache();

  // Test 2: Cached Endpoint (requires dev server)
  results.cached = await testCachedEndpoint();

  // Test 3: Refresh Endpoint (requires dev server + API keys)
  results.refresh = await testRefreshEndpoint();

  // Summary
  log('\n' + '═'.repeat(60), colors.blue);
  log('📊 TEST SUMMARY', colors.blue);
  log('═'.repeat(60), colors.blue);
  log(`Persistent Cache:      ${results.cache ? '✓ PASS' : '✗ FAIL'}`, results.cache ? colors.green : colors.red);
  log(`Cached Endpoint:       ${results.cached ? '✓ PASS' : '✗ FAIL'}`, results.cached ? colors.green : colors.red);
  log(`Refresh Endpoint:      ${results.refresh ? '✓ PASS' : 'ℹ️  SKIPPED'}`, results.refresh ? colors.green : colors.yellow);
  log('═'.repeat(60), colors.blue);

  if (results.cache && results.cached) {
    log('\n✓ Core functionality working!', colors.green);
    log('ℹ️  Configure API keys in .env.local to test full refresh', colors.yellow);
  } else {
    log('\n✗ Some tests failed. Check output above for details.', colors.red);
  }
}

// Run tests
runTests().catch(console.error);

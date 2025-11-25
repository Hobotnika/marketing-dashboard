/**
 * Integration Test Suite for All APIs
 * Tests all endpoints and validates data integrity
 *
 * Run: npx tsx scripts/test-all-apis.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Colors for output
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

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

/**
 * Test 1: Google Ads API endpoint
 */
async function testGoogleAdsAPI(): Promise<TestResult> {
  const start = Date.now();

  try {
    log('\n🧪 Testing Google Ads API...', colors.blue);

    const response = await fetch('http://localhost:3000/api/google-ads/metrics');
    const data = await response.json();

    // Validate structure
    if (!data.success && !data.data) {
      throw new Error('Invalid response structure');
    }

    // If success, validate metrics
    if (data.success && data.data) {
      const metrics = data.data;

      // Validate required fields
      if (typeof metrics.impressions !== 'number') throw new Error('Invalid impressions');
      if (typeof metrics.clicks !== 'number') throw new Error('Invalid clicks');
      if (typeof metrics.ctr !== 'number') throw new Error('Invalid CTR');
      if (typeof metrics.spend !== 'number') throw new Error('Invalid spend');

      // Validate calculations
      const calculatedCTR = (metrics.clicks / metrics.impressions) * 100;
      if (Math.abs(calculatedCTR - metrics.ctr) > 0.1) {
        log(`  ⚠️  Warning: CTR calculation mismatch (${calculatedCTR.toFixed(2)}% vs ${metrics.ctr.toFixed(2)}%)`, colors.yellow);
      }

      log(`  ✓ Impressions: ${metrics.impressions.toLocaleString()}`, colors.green);
      log(`  ✓ Clicks: ${metrics.clicks.toLocaleString()}`, colors.green);
      log(`  ✓ CTR: ${metrics.ctr.toFixed(2)}%`, colors.green);
      log(`  ✓ Spend: $${metrics.spend.toFixed(2)}`, colors.green);
    } else {
      log(`  ℹ️  API not configured or returned cached data`, colors.yellow);
    }

    return {
      name: 'Google Ads API',
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error) {
    log(`  ✗ Error: ${error}`, colors.red);
    return {
      name: 'Google Ads API',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

/**
 * Test 2: Meta Ads API endpoint
 */
async function testMetaAdsAPI(): Promise<TestResult> {
  const start = Date.now();

  try {
    log('\n🧪 Testing Meta Ads API...', colors.blue);

    const response = await fetch('http://localhost:3000/api/meta-ads/metrics');
    const data = await response.json();

    // Validate structure
    if (!data.success && !data.data) {
      throw new Error('Invalid response structure');
    }

    // If success, validate metrics
    if (data.success && data.data) {
      const { campaigns, totals } = data.data;

      // Validate campaigns array
      if (!Array.isArray(campaigns)) throw new Error('Campaigns must be an array');

      // Validate totals
      if (typeof totals.reach !== 'number') throw new Error('Invalid reach');
      if (typeof totals.whatsappConversations !== 'number') throw new Error('Invalid conversations');
      if (typeof totals.spend !== 'number') throw new Error('Invalid spend');
      if (typeof totals.avgCostPerConversation !== 'number') throw new Error('Invalid cost per conversation');

      // Validate cost calculation
      if (totals.whatsappConversations > 0) {
        const calculatedCost = totals.spend / totals.whatsappConversations;
        if (Math.abs(calculatedCost - totals.avgCostPerConversation) > 0.01) {
          log(`  ⚠️  Warning: Cost per conversation mismatch`, colors.yellow);
        }
      }

      log(`  ✓ Campaigns: ${campaigns.length}`, colors.green);
      log(`  ✓ Reach: ${totals.reach.toLocaleString()}`, colors.green);
      log(`  ✓ Conversations: ${totals.whatsappConversations}`, colors.green);
      log(`  ✓ Cost per Conv: $${totals.avgCostPerConversation.toFixed(2)}`, colors.green);
      log(`  ✓ Spend: $${totals.spend.toFixed(2)}`, colors.green);
    } else {
      log(`  ℹ️  API not configured or returned cached data`, colors.yellow);
    }

    return {
      name: 'Meta Ads API',
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error) {
    log(`  ✗ Error: ${error}`, colors.red);
    return {
      name: 'Meta Ads API',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

/**
 * Test 3: Cached metrics endpoint
 */
async function testCachedMetricsAPI(): Promise<TestResult> {
  const start = Date.now();

  try {
    log('\n🧪 Testing Cached Metrics API...', colors.blue);

    const response = await fetch('http://localhost:3000/api/metrics/cached');
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API returned failure');
    }

    // Validate timestamp
    if (!data.timestamp) throw new Error('Missing timestamp');
    const timestamp = new Date(data.timestamp);
    if (isNaN(timestamp.getTime())) throw new Error('Invalid timestamp');

    log(`  ✓ Timestamp: ${timestamp.toLocaleString()}`, colors.green);
    log(`  ✓ Time since update: ${data.timeSinceUpdate || 'Just now'}`, colors.green);

    // Check for data
    if (data.data.google) {
      log(`  ✓ Google Ads data present`, colors.green);
    }
    if (data.data.meta) {
      log(`  ✓ Meta Ads data present`, colors.green);
    }

    return {
      name: 'Cached Metrics API',
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error) {
    log(`  ✗ Error: ${error}`, colors.red);
    return {
      name: 'Cached Metrics API',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

/**
 * Test 4: Alert settings API
 */
async function testAlertSettingsAPI(): Promise<TestResult> {
  const start = Date.now();

  try {
    log('\n🧪 Testing Alert Settings API...', colors.blue);

    const response = await fetch('http://localhost:3000/api/settings/alerts');
    const data = await response.json();

    if (!data.success) {
      throw new Error('API returned failure');
    }

    const { settings } = data;

    // Validate thresholds
    if (!Array.isArray(settings.thresholds)) throw new Error('Thresholds must be an array');
    log(`  ✓ Thresholds: ${settings.thresholds.length}`, colors.green);

    // Validate notification channels
    if (!settings.notificationChannels) throw new Error('Missing notification channels');
    log(`  ✓ Email enabled: ${settings.notificationChannels.email.enabled}`, colors.green);
    log(`  ✓ Slack enabled: ${settings.notificationChannels.slack.enabled}`, colors.green);

    return {
      name: 'Alert Settings API',
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error) {
    log(`  ✗ Error: ${error}`, colors.red);
    return {
      name: 'Alert Settings API',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

/**
 * Test 5: Environment variables
 */
async function testEnvironmentVariables(): Promise<TestResult> {
  const start = Date.now();

  try {
    log('\n🧪 Testing Environment Variables...', colors.blue);

    const required = [
      'CRON_SECRET',
      'API_SECRET_KEY',
    ];

    const optional = [
      'GOOGLE_ADS_CLIENT_ID',
      'GOOGLE_ADS_CLIENT_SECRET',
      'GOOGLE_ADS_DEVELOPER_TOKEN',
      'GOOGLE_ADS_CUSTOMER_ID',
      'GOOGLE_ADS_REFRESH_TOKEN',
      'META_ACCESS_TOKEN',
      'META_AD_ACCOUNT_ID',
      'RESEND_API_KEY',
      'NEXT_PUBLIC_BASE_URL',
    ];

    const missing: string[] = [];
    const present: string[] = [];

    // Check required
    required.forEach(varName => {
      if (process.env[varName]) {
        present.push(varName);
        log(`  ✓ ${varName} is set`, colors.green);
      } else {
        missing.push(varName);
        log(`  ✗ ${varName} is missing (REQUIRED)`, colors.red);
      }
    });

    // Check optional
    optional.forEach(varName => {
      if (process.env[varName]) {
        present.push(varName);
        log(`  ✓ ${varName} is set`, colors.green);
      } else {
        log(`  ⚠️  ${varName} is missing (optional)`, colors.yellow);
      }
    });

    if (missing.length > 0) {
      throw new Error(`Missing required variables: ${missing.join(', ')}`);
    }

    return {
      name: 'Environment Variables',
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error) {
    log(`  ✗ Error: ${error}`, colors.red);
    return {
      name: 'Environment Variables',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

/**
 * Test 6: Cache system
 */
async function testCacheSystem(): Promise<TestResult> {
  const start = Date.now();

  try {
    log('\n🧪 Testing Cache System...', colors.blue);

    const fs = require('fs');
    const path = require('path');

    // Check .cache directory
    const cacheDir = path.join(process.cwd(), '.cache');
    if (!fs.existsSync(cacheDir)) {
      throw new Error('.cache directory does not exist');
    }
    log(`  ✓ .cache directory exists`, colors.green);

    // Check metrics.json
    const metricsFile = path.join(cacheDir, 'metrics.json');
    if (fs.existsSync(metricsFile)) {
      const data = JSON.parse(fs.readFileSync(metricsFile, 'utf-8'));
      log(`  ✓ metrics.json exists`, colors.green);
      log(`  ✓ Last updated: ${new Date(data.timestamp).toLocaleString()}`, colors.green);
    } else {
      log(`  ⚠️  metrics.json does not exist yet (will be created on first cron run)`, colors.yellow);
    }

    // Check alert-settings.json
    const settingsFile = path.join(cacheDir, 'alert-settings.json');
    if (fs.existsSync(settingsFile)) {
      log(`  ✓ alert-settings.json exists`, colors.green);
    } else {
      log(`  ⚠️  alert-settings.json does not exist yet (will be created on first settings save)`, colors.yellow);
    }

    return {
      name: 'Cache System',
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error) {
    log(`  ✗ Error: ${error}`, colors.red);
    return {
      name: 'Cache System',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  log('╔════════════════════════════════════════════════════════════╗', colors.blue);
  log('║  Marketing Dashboard - Integration Test Suite             ║', colors.blue);
  log('╚════════════════════════════════════════════════════════════╝', colors.blue);

  log('\nℹ️  Make sure dev server is running: npm run dev\n', colors.yellow);

  // Run tests sequentially
  results.push(await testEnvironmentVariables());
  results.push(await testCacheSystem());
  results.push(await testGoogleAdsAPI());
  results.push(await testMetaAdsAPI());
  results.push(await testCachedMetricsAPI());
  results.push(await testAlertSettingsAPI());

  // Summary
  log('\n' + '═'.repeat(60), colors.blue);
  log('📊 TEST SUMMARY', colors.blue);
  log('═'.repeat(60), colors.blue);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const icon = result.passed ? '✓' : '✗';
    const color = result.passed ? colors.green : colors.red;
    const duration = `${result.duration}ms`;
    log(`${icon} ${result.name.padEnd(30)} ${duration.padStart(10)}`, color);
    if (result.error) {
      log(`  Error: ${result.error}`, colors.red);
    }
  });

  log('═'.repeat(60), colors.blue);
  log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`, colors.blue);
  log('═'.repeat(60), colors.blue);

  if (failed === 0) {
    log('\n✓ All tests passed! Dashboard is ready for deployment.', colors.green);
    process.exit(0);
  } else {
    log(`\n✗ ${failed} test(s) failed. Please fix issues before deployment.`, colors.red);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);

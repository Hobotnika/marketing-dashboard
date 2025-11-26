/**
 * Test Stripe API Connection
 *
 * Tests the connection to Stripe API and displays revenue metrics.
 *
 * Usage:
 *   npx tsx scripts/test-stripe-connection.ts
 */

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

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

async function testStripeConnection() {
  log('\n🧪 Testing Stripe API Connection...\n', colors.cyan);

  // Check environment variables
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    log('❌ STRIPE_SECRET_KEY not found in environment', colors.red);
    log('   Add it to your .env.local file', colors.yellow);
    process.exit(1);
  }

  if (!secretKey.startsWith('sk_')) {
    log('⚠️  Warning: Secret key should start with "sk_"', colors.yellow);
  }

  const isTestMode = secretKey.startsWith('sk_test_');
  log('✅ Environment variables loaded', colors.green);
  log(`   Mode: ${isTestMode ? 'TEST' : 'LIVE'}`, colors.blue);

  try {
    // Test 1: Fetch account information
    log('\n📝 Test 1: Fetching account information...', colors.cyan);
    const accountResponse = await fetch(`${STRIPE_API_BASE}/account`, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      throw new Error(`Account API error (${accountResponse.status}): ${errorText}`);
    }

    const accountData = await accountResponse.json();
    log('✅ Account data fetched successfully', colors.green);
    log(`   Business Name: ${accountData.business_profile?.name || accountData.settings?.dashboard?.display_name || 'N/A'}`, colors.blue);
    log(`   Country: ${accountData.country}`, colors.blue);
    log(`   Currency: ${accountData.default_currency?.toUpperCase()}`, colors.blue);

    // Test 2: Fetch charges (last 30 days)
    log('\n💳 Test 2: Fetching charges (last 30 days)...', colors.cyan);

    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    const params = new URLSearchParams({
      limit: '10',
      created: JSON.stringify({
        gte: startTimestamp,
        lte: endTimestamp,
      }),
    });

    const chargesResponse = await fetch(
      `${STRIPE_API_BASE}/charges?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!chargesResponse.ok) {
      const errorText = await chargesResponse.text();
      throw new Error(`Charges API error (${chargesResponse.status}): ${errorText}`);
    }

    const chargesData = await chargesResponse.json();
    const allCharges = chargesData.data;
    const successfulCharges = allCharges.filter(
      (charge: any) => charge.status === 'succeeded' && charge.paid && !charge.refunded
    );

    log('✅ Charges fetched successfully', colors.green);
    log(`   Total Charges (last 30 days): ${allCharges.length}`, colors.blue);
    log(`   Successful Charges: ${successfulCharges.length}`, colors.blue);
    log(`   Has More: ${chargesData.has_more}`, colors.blue);

    if (successfulCharges.length > 0) {
      log('\n📊 Sample Successful Charges:', colors.cyan);
      successfulCharges.slice(0, 3).forEach((charge: any, index: number) => {
        const amount = (charge.amount / 100).toFixed(2);
        const currency = charge.currency.toUpperCase();
        log(`   ${index + 1}. $${amount} ${currency}`, colors.blue);
        log(`      Status: ${charge.status}`, colors.blue);
        log(`      Description: ${charge.description || 'N/A'}`, colors.blue);
        log(`      Created: ${new Date(charge.created * 1000).toLocaleString()}`, colors.blue);
      });
    }

    // Test 3: Calculate revenue metrics
    log('\n📈 Test 3: Calculating revenue metrics...', colors.cyan);

    const totalRevenue = successfulCharges.reduce((sum: number, charge: any) => {
      return sum + (charge.amount / 100);
    }, 0);

    const totalConversions = successfulCharges.length;
    const averageOrderValue = totalConversions > 0 ? totalRevenue / totalConversions : 0;

    log('✅ Metrics calculated', colors.green);
    log(`   Total Revenue: $${totalRevenue.toFixed(2)}`, colors.blue);
    log(`   Total Conversions: ${totalConversions}`, colors.blue);
    log(`   Average Order Value: $${averageOrderValue.toFixed(2)}`, colors.blue);

    // Test 4: Test pagination (if has more)
    if (chargesData.has_more) {
      log('\n📄 Test 4: Testing pagination...', colors.cyan);
      const lastChargeId = allCharges[allCharges.length - 1].id;

      const paginationParams = new URLSearchParams({
        limit: '10',
        starting_after: lastChargeId,
        created: JSON.stringify({
          gte: startTimestamp,
          lte: endTimestamp,
        }),
      });

      const paginatedResponse = await fetch(
        `${STRIPE_API_BASE}/charges?${paginationParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (paginatedResponse.ok) {
        const paginatedData = await paginatedResponse.json();
        log('✅ Pagination working correctly', colors.green);
        log(`   Next page has ${paginatedData.data.length} charges`, colors.blue);
      }
    }

    // Success summary
    log('\n✅ All tests passed!', colors.green);
    log('\n📋 Summary:', colors.cyan);
    log('   ✓ Authentication successful', colors.green);
    log('   ✓ Account data accessible', colors.green);
    log('   ✓ Charges fetched successfully', colors.green);
    log('   ✓ Revenue metrics calculated', colors.green);
    log('\n🚀 Your Stripe API integration is ready!', colors.green);

    if (isTestMode) {
      log('\n💡 Tip: You\'re in TEST mode. Use test cards to create charges:', colors.yellow);
      log('   Success: 4242 4242 4242 4242', colors.yellow);
      log('   Decline: 4000 0000 0000 0002', colors.yellow);
    }

  } catch (error) {
    log('\n❌ Test failed:', colors.red);
    if (error instanceof Error) {
      log(`   ${error.message}`, colors.red);
    } else {
      log(`   ${String(error)}`, colors.red);
    }

    log('\n💡 Troubleshooting:', colors.yellow);
    log('   1. Check your STRIPE_SECRET_KEY is valid', colors.yellow);
    log('   2. Verify the key starts with sk_test_ or sk_live_', colors.yellow);
    log('   3. Ensure your Stripe account is active', colors.yellow);
    log('   4. Check you have charges in your account', colors.yellow);
    log('   5. Try regenerating the API key in Stripe Dashboard', colors.yellow);

    process.exit(1);
  }
}

// Run the test
testStripeConnection();

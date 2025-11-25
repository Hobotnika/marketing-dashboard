/**
 * Google Ads API Connection Test Script
 *
 * Run with: npx tsx scripts/test-connection.ts
 *
 * This script tests your Google Ads API configuration and connection.
 */

import { GoogleAdsApi } from 'google-ads-api';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testConnection() {
  console.log('🔍 Testing Google Ads API Connection...\n');

  // Check environment variables
  const requiredVars = [
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_CUSTOMER_ID',
    'GOOGLE_ADS_REFRESH_TOKEN',
  ];

  console.log('✅ Checking environment variables...');
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:');
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    console.error('\n💡 Make sure to configure .env.local file');
    process.exit(1);
  }

  console.log('✅ All environment variables are set\n');

  // Test API connection
  try {
    console.log('🔗 Connecting to Google Ads API...');

    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });

    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    });

    // Try a simple query
    console.log('📊 Fetching account information...');

    const query = `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone
      FROM customer
      LIMIT 1
    `;

    const [result] = await customer.query(query);

    console.log('\n✅ Connection successful!\n');
    console.log('📋 Account Information:');
    console.log(`   Customer ID: ${result.customer?.id}`);
    console.log(`   Account Name: ${result.customer?.descriptive_name}`);
    console.log(`   Currency: ${result.customer?.currency_code}`);
    console.log(`   Time Zone: ${result.customer?.time_zone}`);

    // Test metrics query
    console.log('\n📊 Testing metrics query...');

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const metricsQuery = `
      SELECT
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date BETWEEN '${formatDate(start)}' AND '${formatDate(end)}'
      LIMIT 5
    `;

    const metricsResults = await customer.query(metricsQuery);
    const results = Array.from(metricsResults);

    if (results.length === 0) {
      console.log('⚠️  No campaign data found for the last 7 days');
      console.log('   This is normal if you don\'t have active campaigns');
    } else {
      console.log(`✅ Found ${results.length} campaign records`);
      console.log('\n📈 Sample Metrics:');

      let totalImpressions = 0;
      let totalClicks = 0;
      let totalCost = 0;

      results.forEach((row) => {
        totalImpressions += Number(row.metrics?.impressions || 0);
        totalClicks += Number(row.metrics?.clicks || 0);
        totalCost += Number(row.metrics?.cost_micros || 0);
      });

      console.log(`   Impressions: ${totalImpressions.toLocaleString()}`);
      console.log(`   Clicks: ${totalClicks.toLocaleString()}`);
      console.log(`   Spend: $${(totalCost / 1_000_000).toFixed(2)}`);
    }

    console.log('\n✅ All tests passed! Your dashboard should work correctly.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!\n');

    if (error instanceof Error) {
      console.error('Error:', error.message);

      if (error.message.includes('invalid_grant')) {
        console.error('\n💡 Your refresh token is invalid or expired.');
        console.error('   Generate a new refresh token using the instructions in SETUP.md');
      } else if (error.message.includes('invalid_client')) {
        console.error('\n💡 Your Client ID or Client Secret is incorrect.');
        console.error('   Verify your credentials in .env.local');
      } else if (error.message.includes('PERMISSION_DENIED')) {
        console.error('\n💡 The customer ID doesn\'t have API access or you don\'t have permission.');
        console.error('   Verify your customer ID and API access level');
      }
    } else {
      console.error('Unknown error:', error);
    }

    process.exit(1);
  }
}

// Run the test
testConnection().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

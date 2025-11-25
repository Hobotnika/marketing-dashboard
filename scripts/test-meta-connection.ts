/**
 * Meta Ads API Connection Test Script
 *
 * Run with: npx tsx scripts/test-meta-connection.ts
 *
 * This script tests your Meta Ads API configuration and connection.
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const META_GRAPH_API_VERSION = 'v18.0';
const META_GRAPH_API_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

async function testConnection() {
  console.log('🔍 Testing Meta Ads API Connection...\n');

  // Check environment variables
  const requiredVars = ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'];

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
    console.log('🔗 Connecting to Meta Ads API...');

    const accessToken = process.env.META_ACCESS_TOKEN!;
    const adAccountId = process.env.META_AD_ACCOUNT_ID!;

    // Test 1: Verify access token
    console.log('📊 Verifying access token...');

    const debugTokenUrl = `${META_GRAPH_API_URL}/debug_token?input_token=${accessToken}&access_token=${accessToken}`;
    const debugResponse = await fetch(debugTokenUrl);

    if (!debugResponse.ok) {
      throw new Error(`Token verification failed: ${debugResponse.statusText}`);
    }

    const debugData = await debugResponse.json();
    const tokenData = debugData.data;

    console.log('\n✅ Access token is valid!');
    console.log(`   App ID: ${tokenData.app_id}`);
    console.log(`   User ID: ${tokenData.user_id}`);
    console.log(`   Expires: ${tokenData.expires_at === 0 ? 'Never' : new Date(tokenData.expires_at * 1000).toLocaleString()}`);
    console.log(`   Scopes: ${tokenData.scopes?.join(', ') || 'N/A'}`);

    // Test 2: Get ad account information
    console.log('\n📋 Fetching ad account information...');

    const accountUrl = `${META_GRAPH_API_URL}/${adAccountId}?fields=name,account_id,currency,timezone_name,account_status&access_token=${accessToken}`;
    const accountResponse = await fetch(accountUrl);

    if (!accountResponse.ok) {
      const errorData = await accountResponse.json();
      throw new Error(
        `Failed to fetch account info: ${errorData.error?.message || accountResponse.statusText}`
      );
    }

    const accountData = await accountResponse.json();

    console.log('✅ Account information retrieved!');
    console.log(`   Account ID: ${accountData.account_id}`);
    console.log(`   Name: ${accountData.name}`);
    console.log(`   Currency: ${accountData.currency}`);
    console.log(`   Timezone: ${accountData.timezone_name}`);
    console.log(`   Status: ${accountData.account_status}`);

    // Test 3: Fetch campaigns
    console.log('\n📊 Fetching campaigns...');

    const campaignsUrl = `${META_GRAPH_API_URL}/${adAccountId}/campaigns?fields=id,name,status,objective&limit=10&access_token=${accessToken}`;
    const campaignsResponse = await fetch(campaignsUrl);

    if (!campaignsResponse.ok) {
      const errorData = await campaignsResponse.json();
      throw new Error(
        `Failed to fetch campaigns: ${errorData.error?.message || campaignsResponse.statusText}`
      );
    }

    const campaignsData = await campaignsResponse.json();
    const campaigns = campaignsData.data || [];

    if (campaigns.length === 0) {
      console.log('⚠️  No campaigns found in this ad account');
      console.log('   This is normal if you haven\'t created any campaigns yet');
    } else {
      console.log(`✅ Found ${campaigns.length} campaigns:`);
      campaigns.forEach((campaign: any, index: number) => {
        console.log(`\n   ${index + 1}. ${campaign.name}`);
        console.log(`      ID: ${campaign.id}`);
        console.log(`      Status: ${campaign.status}`);
        console.log(`      Objective: ${campaign.objective || 'N/A'}`);
      });
    }

    // Test 4: Fetch insights for a campaign (if available)
    if (campaigns.length > 0) {
      console.log('\n📈 Testing insights fetch...');

      const testCampaignId = campaigns[0].id;
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);

      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      const insightsUrl = `${META_GRAPH_API_URL}/${testCampaignId}/insights?fields=campaign_id,campaign_name,reach,impressions,spend,actions&time_range=${encodeURIComponent(
        JSON.stringify({
          since: formatDate(start),
          until: formatDate(end),
        })
      )}&access_token=${accessToken}`;

      const insightsResponse = await fetch(insightsUrl);

      if (!insightsResponse.ok) {
        console.log('⚠️  Could not fetch insights (this is sometimes normal for new campaigns)');
      } else {
        const insightsData = await insightsResponse.json();
        const insights = insightsData.data?.[0];

        if (insights) {
          console.log('✅ Successfully fetched campaign insights!');
          console.log(`   Campaign: ${insights.campaign_name}`);
          console.log(`   Reach: ${insights.reach || 0}`);
          console.log(`   Impressions: ${insights.impressions || 0}`);
          console.log(`   Spend: $${insights.spend || 0}`);

          if (insights.actions) {
            console.log(`   Actions: ${insights.actions.length} types recorded`);
            const whatsappConvo = insights.actions.find(
              (a: any) =>
                a.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
                a.action_type === 'messaging_conversation_started_7d'
            );
            if (whatsappConvo) {
              console.log(`   WhatsApp Conversations: ${whatsappConvo.value}`);
            }
          }
        } else {
          console.log('⚠️  No insights data available for the selected period');
        }
      }
    }

    console.log('\n✅ All tests passed! Your Meta Ads integration should work correctly.');
    console.log('\n💡 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Visit: http://localhost:3000');
    console.log('   3. Check the Meta Ads section of the dashboard');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!\n');

    if (error instanceof Error) {
      console.error('Error:', error.message);

      if (error.message.includes('Invalid OAuth')) {
        console.error('\n💡 Your access token is invalid or expired.');
        console.error('   Generate a new token at: https://developers.facebook.com/tools/explorer/');
        console.error('   Make sure to select the correct permissions:');
        console.error('   - ads_read');
        console.error('   - ads_management');
      } else if (error.message.includes('Unsupported get request') || error.message.includes('Invalid parameter')) {
        console.error('\n💡 Your Ad Account ID might be incorrect.');
        console.error('   Format should be: act_123456789');
        console.error('   Find it in Ads Manager URL or Settings');
      } else if (error.message.includes('permissions')) {
        console.error('\n💡 Your access token doesn\'t have the required permissions.');
        console.error('   Required permissions:');
        console.error('   - ads_read');
        console.error('   - ads_management');
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

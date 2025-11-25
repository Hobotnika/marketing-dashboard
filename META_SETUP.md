# Meta Ads Integration - Setup Guide

## Overview

This guide walks you through setting up the Meta (Facebook) Ads API integration to fetch campaign metrics including reach, impressions, spend, and WhatsApp conversation data.

## Features

- **Multi-campaign support**: Displays metrics for all campaigns
- **WhatsApp metrics**: Tracks conversations started (messaging_conversations_started_7d)
- **Automatic calculations**: Cost per conversation and cost per lead
- **Campaign breakdown**: Individual cards for each campaign
- **Aggregated totals**: Summary metrics across all campaigns
- **Error handling**: Falls back to cached data if API fails

## Prerequisites

1. **Meta Business Account** with ad campaigns
2. **Facebook Developer Account**
3. **Meta App** with Marketing API access
4. **Access Token** with proper permissions

## Setup Steps

### 1. Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Business** as the app type
4. Fill in your app details:
   - App Name: "Marketing Dashboard" (or your choice)
   - App Contact Email: Your email
   - Business Account: Select your business
5. Click **Create App**

### 2. Add Marketing API

1. In your app dashboard, find **Marketing API** in the products list
2. Click **Set Up**
3. This enables the Marketing API for your app

### 3. Get Your Access Token

#### Option A: Using Graph API Explorer (Quick - for testing)

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Click **Generate Access Token**
4. Select the required permissions:
   - ✅ `ads_read`
   - ✅ `ads_management`
   - ✅ `business_management`
5. Click **Generate Access Token** and authorize
6. Copy the token (this is a short-lived token, valid for ~2 hours)

#### Option B: Get Long-Lived Token (Recommended - 60 days)

After getting a short-lived token from Graph API Explorer:

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
```

Response:
```json
{
  "access_token": "long_lived_token_here",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

#### Option C: System User Token (Best - never expires)

For production, use a system user token:

1. Go to **Business Settings** in Meta Business Suite
2. Navigate to **Users** → **System Users**
3. Click **Add** to create a new system user
4. Assign the system user to your app
5. Click **Generate New Token**
6. Select your ad account and permissions:
   - ✅ `ads_read`
   - ✅ `ads_management`
7. Copy the token (this never expires)

### 4. Get Your Ad Account ID

#### Method 1: From Ads Manager URL

When you're in Ads Manager, the URL looks like:
```
https://business.facebook.com/adsmanager/manage/campaigns?act=123456789...
```

Your Ad Account ID is: `act_123456789`

#### Method 2: From Business Settings

1. Go to **Business Settings**
2. Click **Accounts** → **Ad Accounts**
3. Select your ad account
4. Copy the ID (format: `123456789`)
5. Add `act_` prefix: `act_123456789`

#### Method 3: Using Graph API Explorer

```bash
curl -X GET "https://graph.facebook.com/v18.0/me/adaccounts?access_token=YOUR_ACCESS_TOKEN"
```

### 5. Configure Environment Variables

Add to `.env.local`:

```env
# Meta (Facebook) Ads API Configuration
META_ACCESS_TOKEN=your_long_lived_or_system_user_token_here
META_AD_ACCOUNT_ID=act_123456789
```

### 6. Test Your Connection

```bash
npm run test:meta
```

Expected output:
```
✅ All environment variables are set
🔗 Connecting to Meta Ads API...
📊 Verifying access token...

✅ Access token is valid!
   App ID: 123456789
   User ID: 987654321
   Expires: Never
   Scopes: ads_read, ads_management

📋 Fetching ad account information...
✅ Account information retrieved!
   Account ID: 123456789
   Name: Your Company
   Currency: USD
   Timezone: America/New_York

📊 Fetching campaigns...
✅ Found 2 campaigns:

   1. Palm Exotic Rentals
      ID: 120210000000000
      Status: ACTIVE
      Objective: OUTCOME_TRAFFIC

   2. Courses Campaign
      ID: 120210000000001
      Status: ACTIVE
      Objective: OUTCOME_LEADS

✅ All tests passed!
```

## Metrics Tracked

### Campaign-Level Metrics

| Metric | Description | Type |
|--------|-------------|------|
| **Reach** | Unique users who saw your ads | Number |
| **Impressions** | Total times ads were shown | Number |
| **WhatsApp Conversations** | Conversations started via WhatsApp ads | Number |
| **Spend** | Total amount spent on campaign | Currency (USD) |
| **Cost per Conversation** | Spend ÷ Conversations | Currency |
| **Leads** | Number of leads generated | Number (optional) |
| **Cost per Lead** | Spend ÷ Leads | Currency (optional) |

### Action Types Tracked

The API automatically detects these action types:

- `messaging_conversation_started_7d` - WhatsApp conversations
- `onsite_conversion.messaging_conversation_started_7d` - WhatsApp conversions
- `lead` - Standard leads
- `onsite_conversion.lead` - Lead form conversions

## API Endpoints

### GET /api/meta-ads/metrics

Fetches Meta Ads campaign metrics for the last 30 days.

**Response:**
```json
{
  "success": true,
  "data": {
    "totals": {
      "reach": 45231,
      "whatsappConversations": 234,
      "spend": 1250.50,
      "avgCostPerConversation": 5.34,
      "leads": 89,
      "avgCostPerLead": 14.05,
      "dateRange": {
        "start": "2025-10-26",
        "end": "2025-11-25"
      }
    },
    "campaigns": [
      {
        "campaignId": "120210000000000",
        "campaignName": "Palm Exotic Rentals",
        "reach": 30000,
        "impressions": 50000,
        "whatsappConversations": 150,
        "spend": 800.00,
        "avgCostPerConversation": 5.33,
        "status": "ACTIVE",
        "objective": "OUTCOME_TRAFFIC"
      }
    ]
  },
  "cached": false
}
```

## Dashboard UI

The dashboard displays:

1. **Total Metrics**: Aggregated across all campaigns
   - Reach
   - WhatsApp Conversations
   - Cost per Conversation
   - Total Spend

2. **Campaign Breakdown**: Individual cards for each campaign with:
   - Campaign name and status
   - All key metrics
   - Objective type
   - Color-coded status badges

## Troubleshooting

### "Invalid OAuth access token"

**Problem**: Token is invalid or expired

**Solution**:
1. Generate a new access token
2. For long-term use, create a system user token
3. Verify token at: https://developers.facebook.com/tools/debug/accesstoken/

### "Unsupported get request"

**Problem**: Ad Account ID is incorrect

**Solution**:
1. Verify the format: `act_123456789`
2. Check you have access to this ad account
3. Confirm the account exists in Business Settings

### "Insufficient permissions"

**Problem**: Token doesn't have required permissions

**Solution**:
1. Regenerate token with these permissions:
   - `ads_read`
   - `ads_management`
2. System users: Assign ad account access in Business Settings

### No campaigns showing

**Problem**: No active campaigns or they're filtered out

**Solution**:
1. Check you have campaigns in Ads Manager
2. Verify campaigns have run within the last 30 days
3. Check campaign status (ACTIVE, PAUSED)

### No WhatsApp conversation data

**Problem**: Campaign doesn't track this metric or no data available

**Solution**:
1. Ensure your campaign objective supports messaging
2. Check if "Click to WhatsApp" ads are set up
3. Verify campaigns have generated conversations
4. Data may take 24-48 hours to appear

### Rate Limits

Meta API has rate limits:
- **Standard**: ~200 API calls per hour per user
- **Business**: Higher limits available

The dashboard's 15-minute cache helps stay within limits:
- Max 4 API calls per hour per user
- Well within standard limits

## Meta Marketing API Resources

- [Marketing API Overview](https://developers.facebook.com/docs/marketing-apis)
- [Insights API Reference](https://developers.facebook.com/docs/marketing-api/insights)
- [Ad Account](https://developers.facebook.com/docs/marketing-api/reference/ad-account)
- [Campaign](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group)
- [Actions](https://developers.facebook.com/docs/marketing-api/insights/action-breakdowns)

## Advanced Configuration

### Change Date Range

Edit `app/api/meta-ads/metrics/route.ts`:

```typescript
function getDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 90); // 90 days instead of 30
  return { start: formatDate(start), end: formatDate(end) };
}
```

### Add More Metrics

Modify the `fieldsParam` in the API route:

```typescript
const fieldsParam = encodeURIComponent(
  'id,name,status,objective,insights{campaign_id,campaign_name,reach,impressions,spend,actions,clicks,ctr,cpc,frequency}'
);
```

### Filter Campaigns

Add filtering in the API route:

```typescript
const campaignsUrl = `${META_GRAPH_API_URL}/${adAccountId}/campaigns?fields=${fieldsParam}&filtering=[{"field":"status","operator":"IN","value":["ACTIVE","PAUSED"]}]&access_token=${accessToken}`;
```

## Security Best Practices

1. **Never commit tokens**: Keep `.env.local` in `.gitignore`
2. **Use system users**: For production, use system user tokens
3. **Rotate regularly**: Even system tokens should be rotated periodically
4. **Minimum permissions**: Only grant necessary permissions
5. **Monitor access**: Check Business Settings regularly for authorized apps

## Testing in Development

For development/testing:
1. Use Graph API Explorer for quick tokens
2. Test with a sandbox ad account if available
3. Use the `test:meta` script to verify setup
4. Check logs in console for detailed errors

## Production Deployment

1. **Generate system user token** (never expires)
2. Add token to production environment variables
3. Verify ad account access in production
4. Test with `npm run test:meta` in production
5. Monitor API usage in Meta Developer console

## Support

For issues:
1. Run `npm run test:meta` for diagnostics
2. Check [Meta Developer Community](https://developers.facebook.com/community/)
3. Review [Meta API Changelog](https://developers.facebook.com/docs/graph-api/changelog)
4. Debug tokens at: https://developers.facebook.com/tools/debug/accesstoken/

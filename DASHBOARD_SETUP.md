# Marketing Dashboard - Complete Setup Guide

This comprehensive guide walks you through setting up the marketing dashboard from scratch, including API configurations, credentials, and troubleshooting.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Google Ads API Setup](#google-ads-api-setup)
4. [Meta Ads API Setup](#meta-ads-api-setup)
5. [Notification Setup](#notification-setup)
6. [Cron Job Configuration](#cron-job-configuration)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Adding New Metrics](#adding-new-metrics)

---

## Prerequisites

### Required Software
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: For version control

### Required Accounts
- **Google Ads**: Active account with API access
- **Meta Business**: Facebook/Instagram Ads account
- **Vercel**: For deployment (or other hosting)
- **Resend**: For email notifications (optional)

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-repo/marketing-dashboard.git
cd marketing-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

```bash
cp .env.example .env.local
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the dashboard.

---

## Google Ads API Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Marketing Dashboard"
3. Enable **Google Ads API**

### Step 2: Create OAuth Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Authorized redirect URIs:
   ```
   http://localhost:3000/oauth/callback
   https://your-domain.vercel.app/oauth/callback
   ```
5. Save **Client ID** and **Client Secret**

### Step 3: Get Developer Token

1. Go to [Google Ads API Center](https://ads.google.com/aw/apicenter)
2. Apply for **Standard Access** (may take 24-48 hours)
3. For testing, use **Test Account** access
4. Copy **Developer Token**

### Step 4: Get Customer ID

1. Log in to [Google Ads](https://ads.google.com/)
2. Click on your account name (top right)
3. Copy **Customer ID** (format: 123-456-7890)

### Step 5: Generate Refresh Token

Run the OAuth flow to get a refresh token:

```bash
npx tsx scripts/test-connection.ts
```

Or use Google's OAuth Playground:

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Settings (gear icon) → Check "Use your own OAuth credentials"
3. Enter your Client ID and Secret
4. Select scope: `https://www.googleapis.com/auth/adwords`
5. Authorize and exchange authorization code for tokens
6. Copy **Refresh Token**

### Step 6: Update .env.local

```env
GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CUSTOMER_ID=123-456-7890
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
```

### Step 7: Test Connection

```bash
npx tsx scripts/test-connection.ts
```

Expected output:
```
✓ Google Ads API connection successful
✓ Impressions: 150,000
✓ Clicks: 3,500
✓ CTR: 2.33%
✓ Spend: $1,250.00
```

---

## Meta Ads API Setup

### Step 1: Create Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Use case: **Business**
4. App name: "Marketing Dashboard"

### Step 2: Add Marketing API

1. In your app dashboard, click **Add Product**
2. Find **Marketing API** → Click **Set Up**

### Step 3: Get Access Token

**Option A: Using Graph API Explorer (Temporary, 1 hour)**

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Get Token → Get User Access Token
4. Select permissions:
   - `ads_read`
   - `ads_management`
5. Copy short-lived token

**Option B: Generate Long-Lived Token (Recommended, 60 days)**

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?\
grant_type=fb_exchange_token&\
client_id=YOUR_APP_ID&\
client_secret=YOUR_APP_SECRET&\
fb_exchange_token=SHORT_LIVED_TOKEN"
```

Response:
```json
{
  "access_token": "LONG_LIVED_TOKEN",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

**Option C: Never-Expiring Token (System User)**

1. Go to Business Settings → Users → System Users
2. Create system user
3. Add assets: Ad accounts
4. Generate token with permissions:
   - `ads_read`
   - `ads_management`

### Step 4: Get Ad Account ID

1. Go to [Meta Ads Manager](https://business.facebook.com/adsmanager/)
2. Select account dropdown
3. Click on account name
4. Look in URL or settings for Account ID (format: 123456789)

### Step 5: Update .env.local

```env
META_ACCESS_TOKEN=your_long_lived_access_token
META_AD_ACCOUNT_ID=act_123456789
```

**Note:** Prefix ad account ID with `act_`

### Step 6: Test Connection

```bash
npx tsx scripts/test-meta-connection.ts
```

Expected output:
```
✓ Meta Ads API connection successful
✓ Campaigns: 3
✓ Reach: 45,000
✓ Conversations: 234
✓ Cost per Conv: $5.34
```

---

## Notification Setup

### Email Notifications (Resend)

#### Step 1: Create Resend Account

1. Sign up at [Resend.com](https://resend.com/)
2. Verify your email address

#### Step 2: Verify Domain (Production)

1. Go to Domains → Add Domain
2. Add your domain: `yourdomain.com`
3. Add DNS records:
   - **TXT** record for verification
   - **CNAME** record for sending
4. Wait for verification (5-10 minutes)

**For Testing (Sandbox Mode):**
- Skip domain verification
- Limit: 100 emails/day to your verified email

#### Step 3: Create API Key

1. Go to API Keys
2. Create new API key
3. Name it: "Marketing Dashboard"
4. Copy key (starts with `re_`)

#### Step 4: Update .env.local

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
```

### Slack Notifications

#### Step 1: Create Slack Webhook

1. Go to [Slack API](https://api.slack.com/messaging/webhooks)
2. Click **Create your Slack app**
3. Choose **From scratch**
4. App name: "Marketing Dashboard"
5. Select workspace

#### Step 2: Enable Incoming Webhooks

1. Features → Incoming Webhooks
2. Toggle **Activate Incoming Webhooks** ON
3. Click **Add New Webhook to Workspace**
4. Select channel (e.g., #marketing-alerts)
5. Copy Webhook URL

#### Step 3: Configure in Dashboard

1. Visit `/settings/alerts`
2. Toggle "Enable Slack notifications"
3. Paste webhook URL
4. Click "Save Settings"

**No environment variable needed** - webhook stored in settings.

---

## Cron Job Configuration

### Step 1: Generate Secrets

```bash
# Generate CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate API_SECRET_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Update .env.local

```env
CRON_SECRET=your_generated_cron_secret_64_chars
API_SECRET_KEY=your_generated_api_key_64_chars
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Change for production
```

### Step 3: Verify vercel.json

File should exist with:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-metrics",
      "schedule": "1 0,6,12,18 * * *"
    }
  ]
}
```

**Schedule explained:**
- `1` = minute 1
- `0,6,12,18` = hours 0, 6, 12, 18 (UTC)
- Runs at: 12:01am, 6:01am, 12:01pm, 6:01pm UTC
- Adjust for your timezone (EST = UTC-5)

---

## Testing

### Run Integration Tests

```bash
# Start dev server first
npm run dev

# In another terminal, run tests
npx tsx scripts/test-all-apis.ts
```

### Expected Output

```
✓ Environment Variables        45ms
✓ Cache System                 12ms
✓ Google Ads API             2341ms
✓ Meta Ads API               1892ms
✓ Cached Metrics API          156ms
✓ Alert Settings API           89ms

Total: 6 | Passed: 6 | Failed: 0

✓ All tests passed! Dashboard is ready for deployment.
```

### Manual Testing Checklist

- [ ] Dashboard loads without errors
- [ ] Google Ads metrics display
- [ ] Meta Ads metrics display
- [ ] Charts render correctly
- [ ] Force Refresh works (requires API_SECRET_KEY)
- [ ] Export PDF works
- [ ] Alert settings page loads
- [ ] Settings save successfully

---

## Deployment

### Deploy to Vercel

#### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy

```bash
vercel deploy --prod
```

#### Step 4: Add Environment Variables

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add all variables from `.env.local`
4. **Important:** Set for all environments (Production, Preview, Development)

#### Step 5: Update NEXT_PUBLIC_BASE_URL

```env
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

Redeploy after changing:

```bash
vercel deploy --prod
```

#### Step 6: Verify Cron Job

1. Vercel Dashboard → Crons
2. Verify job appears with schedule
3. Click "Run Now" to test
4. Check function logs for success

### Deploy to Other Platforms

#### Netlify

1. Connect repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables
5. Add Netlify function for cron (requires additional setup)

#### AWS Amplify

1. Connect repository
2. Build settings: Auto-detected Next.js
3. Add environment variables
4. Use EventBridge for cron (additional setup)

#### Self-Hosted (VPS)

1. Install Node.js and PM2
2. Clone repository
3. `npm install && npm run build`
4. `pm2 start npm --name "dashboard" -- start`
5. Setup nginx reverse proxy
6. Use crontab for scheduled tasks

---

## Troubleshooting

### Google Ads: "Invalid Credentials"

**Cause:** Refresh token expired or invalid

**Solution:**
1. Check token is correctly copied
2. Regenerate refresh token using OAuth flow
3. Ensure Developer Token is approved
4. Verify Customer ID format: `123-456-7890`

### Google Ads: "Developer Token Not Approved"

**Cause:** Waiting for Google review

**Solution:**
1. Apply for Standard Access at API Center
2. Use Test Account access meanwhile
3. Test account has limited data but works for testing

### Meta Ads: "Invalid Access Token"

**Cause:** Token expired (short-lived) or revoked

**Solution:**
1. Generate new long-lived token
2. Use System User for never-expiring token
3. Check token expiry: Use Graph API Explorer → Access Token Tool
4. Verify app has `ads_read` permission

### Meta Ads: "Ad Account Not Found"

**Cause:** Incorrect Ad Account ID or permissions

**Solution:**
1. Verify Ad Account ID format: `act_123456789`
2. Ensure token has access to the ad account
3. Check Business Manager permissions
4. Use Graph API Explorer to test: `/act_123456789/campaigns`

### Cron Job Not Running

**Symptoms:** Data never updates

**Solutions:**
1. Verify `vercel.json` in repository root
2. Check Vercel Dashboard → Crons
3. Ensure `CRON_SECRET` matches in env vars
4. Redeploy after adding cron configuration
5. Check function logs for errors

### Email Notifications Not Sending

**Symptoms:** No emails received

**Solutions:**
1. Verify `RESEND_API_KEY` is correct
2. Check domain verification (or use sandbox)
3. Check spam folder
4. Review Resend dashboard → Logs
5. Verify recipients are added in settings

### Cache Not Updating

**Symptoms:** Old data persists

**Solutions:**
1. Check `.cache/` directory exists
2. Verify file permissions
3. Check cron job execution logs
4. Force refresh from dashboard
5. Clear cache manually: `rm -rf .cache/*`

### High API Costs

**Symptoms:** Unexpected charges

**Solutions:**
1. Verify cron schedule (should be 6 hours)
2. Check for multiple instances calling APIs
3. Review API rate limits
4. Implement stricter caching
5. Monitor Vercel function invocations

---

## Adding New Metrics

### Add New Google Ads Metric

#### Step 1: Update Type Definition

```typescript
// types/google-ads.ts
export interface GoogleAdsMetrics {
  // ... existing fields
  conversions: number; // Add new field
}
```

#### Step 2: Update API Route

```typescript
// app/api/google-ads/metrics/route.ts

// Add to GAQL query
const query = `
  SELECT
    metrics.impressions,
    metrics.clicks,
    metrics.ctr,
    metrics.cost_micros,
    metrics.conversions  // Add here
  FROM campaign
  WHERE segments.date BETWEEN '${dateRange.start}' AND '${dateRange.end}'
`;

// Add to aggregation
const conversions = results.reduce((sum, row) => sum + row.metrics.conversions, 0);

// Add to response
return {
  conversions,
  // ...
};
```

#### Step 3: Update Dashboard

```typescript
// app/page.tsx

<MetricsCard
  title="Conversions"
  value={cachedData.google.conversions.toLocaleString()}
  subtitle="Total conversions"
  icon={<ConversionIcon />}
/>
```

### Add New Meta Ads Metric

#### Step 1: Update Type Definition

```typescript
// types/meta-ads.ts
export interface MetaAdsMetrics {
  // ... existing fields
  linkClicks: number; // Add new field
}
```

#### Step 2: Update API Route

```typescript
// app/api/meta-ads/metrics/route.ts

// Add to fields
const fields = [
  'reach',
  'spend',
  'actions',
  'link_clicks', // Add here
].join(',');

// Extract from API response
const linkClicks = insight.link_clicks || 0;
```

#### Step 3: Update Dashboard

```typescript
<MetricsCard
  title="Link Clicks"
  value={cachedData.meta.totals.linkClicks.toLocaleString()}
/>
```

### Add New Chart

#### Step 1: Generate Mock Data

```typescript
// lib/mockData.ts
export function generateNewChartData(days: number) {
  return Array.from({ length: days }, (_, i) => ({
    date: formatDate(new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000)),
    value: Math.floor(Math.random() * 1000),
  }));
}
```

#### Step 2: Add to Dashboard

```typescript
import { LineChart } from '@/components/LazyCharts';

<LineChart
  title="New Metric Over Time"
  data={generateNewChartData(14)}
  lines={[
    { dataKey: 'value', name: 'Metric', color: '#3B82F6' },
  ]}
  xAxisKey="date"
/>
```

---

## Security Best Practices

### Never Commit Secrets

```bash
# Ensure .env.local is in .gitignore
echo ".env.local" >> .gitignore

# Check for accidentally committed secrets
git log --all --full-history -- .env.local
```

### Rotate Secrets Regularly

- **API Keys:** Every 90 days
- **Access Tokens:** When expired or compromised
- **Cron Secrets:** Every 6 months

### Use Environment-Specific Secrets

```
Development: .env.local (git ignored)
Production: Vercel env vars (encrypted)
Staging: Separate Vercel project
```

### Limit Permissions

- Google Ads: Read-only access
- Meta Ads: `ads_read` only (not `ads_management` unless needed)
- Slack: Webhook to specific channel only

---

## Maintenance

### Daily
- [ ] Check dashboard loads correctly
- [ ] Verify data is updating

### Weekly
- [ ] Review cron execution logs
- [ ] Check for API errors
- [ ] Monitor cache hit rates

### Monthly
- [ ] Rotate API keys (if policy requires)
- [ ] Review alert settings
- [ ] Check for dependency updates: `npm outdated`
- [ ] Review performance metrics

### Quarterly
- [ ] Renew Meta long-lived token
- [ ] Audit user access permissions
- [ ] Review and optimize queries
- [ ] Update documentation

---

## Support Resources

### Official Documentation
- [Google Ads API](https://developers.google.com/google-ads/api)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Resend Docs](https://resend.com/docs)

### Community
- [Google Ads API Forum](https://groups.google.com/g/adwords-api)
- [Meta Developer Community](https://developers.facebook.com/community/)
- [Next.js Discussions](https://github.com/vercel/next.js/discussions)

### Dashboard Documentation
- `README.md` - Project overview
- `CRON_DOCUMENTATION.md` - Cron system details
- `ALERTS_DOCUMENTATION.md` - Alert system guide
- `PERFORMANCE_OPTIMIZATION.md` - Performance tips
- `DEPLOYMENT_CHECKLIST.md` - Deployment guide

---

**Last Updated:** 2025-11-25
**Version:** 1.0.0
**Status:** Production Ready ✅

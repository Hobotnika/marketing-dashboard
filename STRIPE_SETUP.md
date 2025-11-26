# Stripe Integration Setup Guide

Complete guide to integrating Stripe API for tracking revenue, conversions, and calculating ROI in your marketing dashboard.

---

## Overview

The Stripe integration allows you to track:
- **Total Revenue** - All successful payments in your date range
- **Total Conversions** - Number of successful charges
- **Average Order Value (AOV)** - Revenue per conversion
- **ROAS (Return on Ad Spend)** - Revenue divided by total ad spend
- **Net Profit** - Revenue minus ad spend

### Features

✅ **Automatic ROAS Calculation** - Combines Stripe revenue + Google/Meta ad spend
✅ **Color-Coded ROAS** - Green (>3x), Yellow (1-3x), Red (<1x)
✅ **Weekly Revenue Breakdown** - Revenue vs Ad Spend chart
✅ **Real-Time Metrics** - Updates every 6 hours
✅ **Cache Fallback** - Shows last data if API fails
✅ **Zero Revenue Handling** - Shows $0 instead of errors

---

## Prerequisites

1. **Stripe Account** (any plan, including free)
2. **API Access** (available to all accounts)
3. **Secret API Key**

---

## Step 1: Create Stripe Account

If you don't have a Stripe account:

1. Go to [stripe.com](https://stripe.com)
2. Click **"Start now"** or **"Sign up"**
3. Create your account
4. Verify your email

---

## Step 2: Get API Keys

### 2.1 Navigate to API Keys

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers** in the left sidebar
3. Click **API keys**
4. Or visit directly: https://dashboard.stripe.com/apikeys

### 2.2 Get Secret Key

**For Testing (Test Mode):**
1. Ensure you're in **Test mode** (toggle in top-right)
2. Find **Secret key** in the table
3. Click **Reveal test key**
4. Copy the key (starts with `sk_test_`)

**For Production (Live Mode):**
1. Switch to **Live mode** (toggle in top-right)
2. Find **Secret key** in the table
3. Click **Reveal live key**
4. Copy the key (starts with `sk_live_`)

⚠️ **Important:** Never share or commit your secret key!

### 2.3 Get Publishable Key (Optional)

While not strictly required for this integration, you may want it for future features:

1. Find **Publishable key** in the same table
2. Copy it (starts with `pk_test_` or `pk_live_`)

---

## Step 3: Configure Environment Variables

Add these variables to your `.env.local` file:

```env
# Stripe API Configuration
STRIPE_SECRET_KEY=sk_test_51Abc...xyz
STRIPE_PUBLISHABLE_KEY=pk_test_51Abc...xyz
```

**Security Notes:**
- ✅ Store in `.env.local` (git ignored)
- ✅ Never commit to version control
- ✅ Use test keys for development
- ✅ Use live keys only in production
- ❌ Don't expose secret key in client code

---

## Step 4: Test the Integration

### 4.1 Start Development Server

```bash
npm run dev
```

### 4.2 Test API Endpoint

```bash
curl http://localhost:3000/api/stripe/revenue
```

**Expected Response:**
```json
{
  "totalRevenue": 12450.50,
  "totalConversions": 42,
  "averageOrderValue": 296.44,
  "roas": 0,
  "profit": 0,
  "dateRange": {
    "start": "2024-10-26",
    "end": "2024-11-26"
  },
  "lastUpdated": "2024-11-26T12:00:00.000Z"
}
```

**Note:** `roas` and `profit` are calculated in the dashboard using ad spend data.

### 4.3 Check Dashboard

1. Open http://localhost:3000
2. See **"Revenue & ROI"** section at the top
3. Verify metrics display:
   - Total Revenue
   - Total Conversions
   - ROAS (color-coded)
   - Net Profit
4. Check "Revenue vs Ad Spend" chart displays

---

## Step 5: Verify Cron Job Integration

The cron job automatically refreshes Stripe data every 6 hours.

### Test Manual Refresh

```bash
curl -X POST http://localhost:3000/api/cron/refresh-metrics \
  -H "x-api-key: YOUR_API_SECRET_KEY"
```

**Expected Output:**
```json
{
  "success": true,
  "timestamp": "2024-11-26T12:00:00.000Z",
  "data": {
    "google": "fetched",
    "meta": "fetched",
    "calendly": "fetched",
    "stripe": "fetched"
  },
  "cached": true
}
```

---

## How It Works

### Data Flow

1. **Cron Job** runs every 6 hours
2. **Fetches successful charges** from Stripe API (last 30 days)
3. **Filters charges** - Only `succeeded`, `paid`, not `refunded`
4. **Calculates metrics:**
   - Total revenue = sum of charge amounts (cents → dollars)
   - Total conversions = count of successful charges
   - AOV = revenue / conversions
5. **Stores in cache** (`.cache/metrics.json`)
6. **Dashboard calculates ROAS:**
   - ROAS = Stripe Revenue / (Google Ads Spend + Meta Ads Spend)
   - Profit = Revenue - Ad Spend
7. **Color-codes ROAS:**
   - Green: ≥ 3.0x (excellent)
   - Yellow: 1.0x - 2.9x (good)
   - Red: < 1.0x (poor)

### API Endpoints Used

**Stripe API v1:**
- **List Charges:** `GET /v1/charges`
  - Filtered by: `created` timestamp, `status=succeeded`
  - Pagination: 100 charges per page

### Metrics Calculated

```typescript
interface RevenueMetrics {
  totalRevenue: number;        // Sum of all charges (in USD)
  totalConversions: number;    // Count of successful charges
  averageOrderValue: number;   // revenue / conversions
  roas: number;                // Calculated in dashboard
  profit: number;              // Calculated in dashboard
  dateRange: {
    start: string;             // YYYY-MM-DD
    end: string;               // YYYY-MM-DD
  };
}
```

### ROAS Calculation (Dashboard)

```typescript
const stripeRevenue = 12450.50;
const googleAdSpend = 2500.00;
const metaAdSpend = 1250.00;
const totalAdSpend = googleAdSpend + metaAdSpend;  // 3750.00

const roas = stripeRevenue / totalAdSpend;  // 3.32x
const profit = stripeRevenue - totalAdSpend;  // $8,700.50
```

---

## Troubleshooting

### Error: "Stripe credentials not configured"

**Cause:** Missing `STRIPE_SECRET_KEY`

**Fix:**
1. Check `.env.local` has `STRIPE_SECRET_KEY`
2. Restart dev server: `npm run dev`
3. Verify key starts with `sk_test_` or `sk_live_`

### Error: "Stripe API error (401)"

**Cause:** Invalid or expired API key

**Fix:**
1. Go to Stripe Dashboard → Developers → API keys
2. Copy a fresh secret key
3. Update `STRIPE_SECRET_KEY` in `.env.local`
4. Restart server

### Error: "No charge objects found"

**Cause:** No successful payments in the last 30 days

**Fix:**
1. Create test charges in Stripe Dashboard
2. Or use Stripe test mode with test cards
3. Or adjust date range:
   ```bash
   curl "http://localhost:3000/api/stripe/revenue?startDate=2024-01-01&endDate=2024-12-31"
   ```

### Dashboard shows "$0 Revenue"

**Possible Causes:**
1. No successful charges in date range
2. Using test key with no test charges
3. API credentials not configured

**Fix:**
1. Check you have charges in Stripe Dashboard
2. Verify you're using correct mode (test vs live)
3. Check date range matches your charges
4. Trigger manual refresh

### ROAS shows "0x"

**Cause:** No ad spend data (Google Ads or Meta Ads not configured)

**Explanation:** ROAS can only be calculated when you have both:
- Stripe revenue data
- Ad spend data (from Google Ads and/or Meta Ads)

**Fix:**
1. Configure Google Ads API (see `SETUP.md`)
2. Configure Meta Ads API (see `META_SETUP.md`)
3. Wait for next cron refresh (6 hours)

---

## Dashboard Features

### 1. Revenue & ROI Section (Top of Dashboard)

Highlighted section with 4 large KPI cards:

**Total Revenue**
- Shows sum of all successful Stripe charges
- Green color scheme
- Displays number of conversions below

**Total Conversions**
- Number of successful charges
- Blue color scheme
- Shows Average Order Value below

**ROAS (Return on Ad Spend)**
- Calculated: Revenue / Ad Spend
- **Color-coded:**
  - 🟢 Green: ≥ 3.0x (excellent ROI)
  - 🟡 Yellow: 1.0x - 2.9x (break-even to good)
  - 🔴 Red: < 1.0x (losing money)
- Format: "3.2x"

**Net Profit**
- Calculated: Revenue - Ad Spend
- Green if positive, red if negative
- Shows absolute value

### 2. Revenue vs Ad Spend Chart

Bar chart comparing:
- Revenue (green bars)
- Ad Spend (red bars)
- Broken down by week (last 4 weeks)

Helps visualize profitability trends.

---

## API Reference

### GET /api/stripe/revenue

Fetch Stripe revenue metrics.

**Query Parameters:**
- `startDate` (optional): `YYYY-MM-DD` (default: 30 days ago)
- `endDate` (optional): `YYYY-MM-DD` (default: today)

**Example:**
```bash
curl "http://localhost:3000/api/stripe/revenue?startDate=2024-11-01&endDate=2024-11-30"
```

**Response:**
```json
{
  "totalRevenue": 15250.00,
  "totalConversions": 52,
  "averageOrderValue": 293.27,
  "roas": 0,
  "profit": 0,
  "dateRange": {
    "start": "2024-11-01",
    "end": "2024-11-30"
  },
  "lastUpdated": "2024-11-26T12:00:00.000Z",
  "charges": [...]
}
```

---

## Rate Limits

**Stripe API Limits:**
- **100 requests per second** per API key
- **No daily limit**

**Dashboard Implementation:**
- Fetches data every 6 hours (4 times/day)
- Uses pagination (max 100 charges per request)
- Well within rate limits

---

## Security Best Practices

### 1. Protect Your Secret Key

- ✅ Store in `.env.local` (git ignored)
- ✅ Never commit to version control
- ✅ Use environment variables in production
- ✅ Rotate keys if exposed
- ❌ Don't expose in client-side code
- ❌ Don't log secret keys
- ❌ Don't share in screenshots

### 2. Use Test Mode for Development

- ✅ Use `sk_test_` keys in development
- ✅ Use `sk_live_` keys only in production
- ✅ Test with Stripe test cards

**Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
```

### 3. Key Rotation

Rotate your API keys periodically (every 6-12 months):

1. Generate new key in Stripe Dashboard
2. Update environment variables
3. Deploy/restart application
4. Delete old key from Stripe

### 4. Production Deployment

When deploying to Vercel:
1. Add `STRIPE_SECRET_KEY` in Vercel Dashboard
2. Use **live mode** key (`sk_live_`)
3. Set for **Production** environment only
4. Test in preview environment first

---

## Advanced Configuration

### Filter by Currency

Currently processes all currencies. To filter specific currency:

```typescript
// In /app/api/stripe/revenue/route.ts
const successfulCharges = data.data.filter(
  charge =>
    charge.status === 'succeeded' &&
    charge.paid &&
    !charge.refunded &&
    charge.currency === 'usd'  // Add currency filter
);
```

### Exclude Specific Charges

Filter by metadata or description:

```typescript
const successfulCharges = data.data.filter(
  charge =>
    charge.status === 'succeeded' &&
    charge.paid &&
    !charge.refunded &&
    !charge.description?.includes('test')  // Exclude test charges
);
```

### Custom Date Ranges

Fetch data for specific periods:

```bash
# Last quarter
curl "http://localhost:3000/api/stripe/revenue?startDate=2024-10-01&endDate=2024-12-31"

# Current year
curl "http://localhost:3000/api/stripe/revenue?startDate=2024-01-01&endDate=2024-12-31"
```

---

## FAQ

### Q: Can I track subscription revenue?

**A:** Currently tracks one-time charges. For subscriptions, you would need to:
1. Fetch subscription data via `/v1/subscriptions`
2. Calculate MRR (Monthly Recurring Revenue)
3. Add to metrics calculation

### Q: How does it handle refunds?

**A:** Refunded charges are excluded from revenue calculations. The filter checks `!charge.refunded`.

### Q: What about partial refunds?

**A:** Partially refunded charges are included with full amount. To account for partial refunds, subtract `amount_refunded`:

```typescript
const netAmount = charge.amount_captured - charge.amount_refunded;
```

### Q: Can I track multiple Stripe accounts?

**A:** Currently supports one account. To track multiple:
1. Create separate API endpoints for each account
2. Aggregate data in dashboard
3. Use different environment variables for each

### Q: How accurate is the ROAS calculation?

**A:** Very accurate if:
- All revenue flows through Stripe
- All ad spend is tracked in Google/Meta Ads
- Date ranges match (same 30-day period)

### Q: What if I use multiple payment processors?

**A:** You would need to:
1. Create endpoints for each processor (PayPal, Square, etc.)
2. Aggregate revenue from all sources
3. Calculate combined ROAS

---

## Next Steps

After setting up Stripe integration:

1. ✅ **Monitor ROAS daily** - Track ROI in real-time
2. ✅ **Optimize ad spend** - Cut campaigns with low ROAS
3. ✅ **A/B test pricing** - Experiment with different price points
4. ✅ **Track seasonal trends** - Revenue vs Ad Spend by week
5. ✅ **Set profit goals** - Monitor net profit trends
6. ✅ **Set up alerts** - Get notified when ROAS drops below threshold

---

## Support

**Stripe API Documentation:**
- [Getting Started](https://stripe.com/docs/api)
- [Charges API](https://stripe.com/docs/api/charges)
- [Authentication](https://stripe.com/docs/api/authentication)
- [Testing](https://stripe.com/docs/testing)

**Dashboard Documentation:**
- Setup: `DASHBOARD_SETUP.md`
- Deployment: `FINAL_DEPLOYMENT_CHECKLIST.md`
- Main README: `README.md`

**Common Issues:**
- Key invalid → Regenerate in Dashboard
- No data showing → Check you have charges
- Wrong mode → Switch test/live mode
- ROAS showing 0x → Configure ad platforms

---

**Last Updated:** 2025-11-26
**Version:** 1.0.0
**Status:** Production Ready ✅

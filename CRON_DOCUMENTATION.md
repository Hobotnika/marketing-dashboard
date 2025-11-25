# Automatic Data Refresh System - Documentation

## Overview

The dashboard implements an automatic data refresh system that fetches metrics from Google Ads and Meta Ads APIs every 6 hours and stores them in persistent cache.

## Architecture

```
┌─────────────────┐
│  Vercel Cron    │  Schedule: 12:01am, 6:01am, 12:01pm, 6:01pm EST
│  (Every 6h)     │  Cron: "1 0,6,12,18 * * *"
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  /api/cron/refresh-metrics          │
│  - Authenticates with CRON_SECRET   │
│  - Rate limiting (5 req/hour)       │
│  - Fetches Google & Meta data       │
│  - Saves to .cache/metrics.json     │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  .cache/metrics.json                │
│  - Google Ads metrics               │
│  - Meta Ads campaigns & totals      │
│  - Timestamp                        │
│  - Error log if any API fails       │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  /api/metrics/cached                │
│  - Reads from .cache/metrics.json   │
│  - Calculates time since update     │
│  - Returns data to dashboard        │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Dashboard (app/page.tsx)           │
│  - Displays cached data             │
│  - Shows "Last Updated" timestamp   │
│  - Manual refresh button            │
│  - Polls every 2 minutes for updates│
└─────────────────────────────────────┘
```

## Components

### 1. Cron Endpoint (`/api/cron/refresh-metrics`)

**Location**: `app/api/cron/refresh-metrics/route.ts`

**Purpose**: Fetches fresh data from all APIs and stores in cache

**Features**:
- **Authentication**: Requires `CRON_SECRET` (Vercel Cron) or `API_SECRET_KEY` (manual)
- **Rate Limiting**: Max 5 requests per hour per IP
- **Parallel Fetching**: Fetches Google and Meta APIs simultaneously
- **Error Handling**: Stores partial data if only one API fails
- **Logging**: Console logs for debugging

**Request**:
```bash
# Vercel Cron (automatic)
GET /api/cron/refresh-metrics
Authorization: Bearer ${CRON_SECRET}

# Manual refresh
POST /api/cron/refresh-metrics
x-api-key: ${API_SECRET_KEY}
```

**Response**:
```json
{
  "success": true,
  "timestamp": "2025-11-25T12:01:00.000Z",
  "data": {
    "google": "fetched",
    "meta": "fetched"
  },
  "cached": true
}
```

**Error Response**:
```json
{
  "success": false,
  "timestamp": "2025-11-25T12:01:00.000Z",
  "errors": {
    "google": "Invalid credentials",
    "meta": "Rate limit exceeded"
  }
}
```

### 2. Persistent Cache (`lib/persistent-cache.ts`)

**Purpose**: File-based caching for metrics data

**Storage Location**: `.cache/metrics.json`

**Functions**:

#### `readCachedMetrics()`
Reads cached data from file

```typescript
const cached = readCachedMetrics();
// Returns: CachedMetrics | null
```

#### `writeCachedMetrics(metrics)`
Writes metrics to cache file

```typescript
const success = writeCachedMetrics({
  google: {...},
  meta: {...},
  timestamp: new Date().toISOString(),
  success: true
});
// Returns: boolean
```

#### `getTimeSinceUpdate()`
Human-readable time since last update

```typescript
const timeSince = getTimeSinceUpdate();
// Returns: "5 minutes ago" | "2 hours ago" | "1 day ago"
```

#### `shouldRefresh()`
Checks if cache is older than 6 hours

```typescript
const needsRefresh = shouldRefresh();
// Returns: boolean
```

**Data Structure**:
```json
{
  "google": {
    "impressions": 150000,
    "clicks": 3500,
    "ctr": 2.33,
    "spend": 1250.50,
    "dateRange": {
      "start": "2025-10-26",
      "end": "2025-11-25"
    }
  },
  "meta": {
    "campaigns": [...],
    "totals": {
      "reach": 45000,
      "whatsappConversations": 234,
      "spend": 1250.50,
      "avgCostPerConversation": 5.34,
      "dateRange": {...}
    }
  },
  "timestamp": "2025-11-25T12:01:00.000Z",
  "success": true,
  "errors": {}
}
```

### 3. Cached Metrics Endpoint (`/api/metrics/cached`)

**Location**: `app/api/metrics/cached/route.ts`

**Purpose**: Serves cached data to dashboard

**Request**:
```bash
GET /api/metrics/cached
```

**Response**:
```json
{
  "success": true,
  "data": {
    "google": {...},
    "meta": {...}
  },
  "timestamp": "2025-11-25T12:01:00.000Z",
  "timeSinceUpdate": "5 minutes ago",
  "errors": {}
}
```

### 4. Dashboard Header Component

**Location**: `components/DashboardHeader.tsx`

**Features**:
- Displays last update timestamp
- Human-readable time since update ("5 minutes ago")
- Force refresh button
- Auto-refresh schedule info

**Usage**:
```tsx
<DashboardHeader
  lastUpdate="2025-11-25T12:01:00.000Z"
  timeSinceUpdate="5 minutes ago"
  onManualRefresh={handleManualRefresh}
/>
```

## Configuration

### Environment Variables

Required in `.env.local`:

```env
# Vercel Cron authentication
CRON_SECRET=your_random_secret_here

# Manual refresh API key
API_SECRET_KEY=your_api_key_here

# Base URL for API calls (production)
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

### Vercel Cron Configuration

**File**: `vercel.json`

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

**Schedule Explained**:
- Format: `minute hour day month dayofweek`
- `1 0,6,12,18 * * *` = Run at minute 1 of hours 0, 6, 12, 18
- Times: 12:01am, 6:01am, 12:01pm, 6:01pm
- Timezone: UTC (adjust for EST: -5 hours)
- EST Times: ~7:01pm, 1:01am, 7:01am, 1:01pm

## Deployment

### Vercel Deployment Steps

1. **Add Environment Variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add `CRON_SECRET` (generate random string)
   - Add `API_SECRET_KEY` (generate random string)
   - Add `NEXT_PUBLIC_BASE_URL` (your-app.vercel.app)
   - Add all Google/Meta API credentials

2. **Deploy to Vercel**:
   ```bash
   vercel deploy --prod
   ```

3. **Verify Cron Job**:
   - Go to Vercel Dashboard → Project → Crons
   - Check that cron job appears with schedule
   - Test manually with Vercel's "Run Now" button

4. **Monitor Logs**:
   - Vercel Dashboard → Deployments → Functions
   - Check `/api/cron/refresh-metrics` logs
   - Look for `[CRON]` prefixed messages

### Generating Secrets

```bash
# Generate CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate API_SECRET_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Manual Refresh

The dashboard includes a "Force Refresh" button for manual updates.

**How it Works**:
1. User clicks "Force Refresh" button
2. Browser prompts for API key
3. POSTs to `/api/cron/refresh-metrics` with `x-api-key` header
4. Cron endpoint fetches fresh data
5. Dashboard reloads data after 1 second

**Security Note**: API key should be kept secret and only used by admins.

## Rate Limiting

### Implementation

Simple in-memory rate limiter:
- **Window**: 1 hour (3600000ms)
- **Max Requests**: 5 per window per identifier
- **Identifier**: IP address or "cron-job"

### Limitations

- In-memory (resets on server restart)
- Not shared across serverless instances
- For production, consider Redis-based rate limiting

### Bypass

Vercel Cron requests are identified separately and not affected by rate limits from manual requests.

## Monitoring

### Check Last Update

Visit dashboard and look for blue info box:
```
🕐 Last Updated: 5 minutes ago (11/25/2025, 12:01:00 PM)
ℹ️ Auto-refresh: Every 6 hours (12:01am, 6:01am, 12:01pm, 6:01pm EST)
```

### Check Cache File

```bash
cat .cache/metrics.json | jq .timestamp
```

### Monitor Cron Execution

**Vercel Dashboard**:
1. Go to Project → Crons
2. View execution history
3. Check success/failure status

**Logs**:
```bash
# View function logs
vercel logs /api/cron/refresh-metrics --follow
```

## Troubleshooting

### Cron Not Running

**Symptoms**: Data never updates, old timestamp

**Solutions**:
1. Check `vercel.json` is in project root
2. Verify cron appears in Vercel Dashboard → Crons
3. Check `CRON_SECRET` is set in environment variables
4. Redeploy after adding cron configuration

### Authentication Errors

**Symptoms**: 401 Unauthorized

**Solutions**:
1. Verify `CRON_SECRET` matches in:
   - `.env.local` (development)
   - Vercel environment variables (production)
2. Check Authorization header format: `Bearer ${CRON_SECRET}`
3. For manual refresh, use `x-api-key` header with `API_SECRET_KEY`

### Rate Limit Exceeded

**Symptoms**: 429 Too Many Requests

**Solutions**:
1. Wait 1 hour before retrying
2. Use Vercel Cron instead of manual refresh
3. Check for scripts calling endpoint repeatedly

### API Errors

**Symptoms**: Data shows errors, warnings on dashboard

**Check**:
1. Google/Meta API credentials are valid
2. API rate limits not exceeded
3. Network connectivity

**View Errors**:
```bash
# Check cached metrics
cat .cache/metrics.json | jq .errors
```

### Cache Not Updating

**Symptoms**: Cron runs but data stays old

**Solutions**:
1. Check file permissions on `.cache/` directory
2. Verify disk space available
3. Check function logs for write errors
4. Ensure `.cache/` is not in `.gitignore` for deployment

## Upgrading to Database

For production scale, consider upgrading from file-based cache to database:

### PostgreSQL Example

```typescript
import { sql } from '@vercel/postgres';

// Write metrics
await sql`
  INSERT INTO marketing_metrics (google_data, meta_data, timestamp, success)
  VALUES (${JSON.stringify(google)}, ${JSON.stringify(meta)}, NOW(), ${success})
`;

// Read metrics
const result = await sql`
  SELECT * FROM marketing_metrics
  ORDER BY timestamp DESC
  LIMIT 1
`;
```

### Benefits

- Historical data tracking
- Better scalability
- Query capabilities
- Multi-instance consistency
- Automatic backups

## API Reference

### POST /api/cron/refresh-metrics

Triggers manual data refresh.

**Headers**:
- `x-api-key: string` - API secret key

**Response**: 200 OK
```json
{
  "success": true,
  "timestamp": "2025-11-25T12:01:00.000Z",
  "data": {
    "google": "fetched",
    "meta": "fetched"
  },
  "cached": true
}
```

### GET /api/metrics/cached

Retrieves cached metrics data.

**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "google": {...},
    "meta": {...}
  },
  "timestamp": "2025-11-25T12:01:00.000Z",
  "timeSinceUpdate": "5 minutes ago"
}
```

## Best Practices

1. **Secrets Management**:
   - Never commit secrets to git
   - Use different secrets for dev/prod
   - Rotate secrets regularly

2. **Monitoring**:
   - Set up alerts for failed cron jobs
   - Monitor API rate limits
   - Track cache hit/miss rates

3. **Error Handling**:
   - Store partial data if one API fails
   - Log all errors for debugging
   - Show user-friendly warnings on dashboard

4. **Performance**:
   - Fetch APIs in parallel
   - Cache for 6 hours minimum
   - Use compact JSON format

5. **Security**:
   - Rate limit manual refresh endpoint
   - Authenticate all cron requests
   - Validate all input data

## Future Enhancements

- [ ] Database storage for historical data
- [ ] Email/Slack notifications on failures
- [ ] Configurable refresh schedule per user
- [ ] Retry logic for failed API calls
- [ ] Metrics on cron execution time
- [ ] Dashboard for cron job management
- [ ] Webhook support for external triggers
- [ ] Data export functionality

## Support

For issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test manual refresh with API key
4. Review this documentation
5. Check `.cache/metrics.json` contents

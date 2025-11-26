# Calendly Integration Setup Guide

Complete guide to integrating Calendly API for tracking meeting bookings in your marketing dashboard.

---

## Overview

The Calendly integration allows you to track:
- **Total meetings booked** through your Calendly links
- **Completed meetings** (excluding canceled and no-shows)
- **No-show rate** to monitor attendance
- **Lead to Meeting conversion** (WhatsApp conversations → Calendly bookings)

### Features

✅ **Automatic Data Refresh** - Updates every 6 hours via cron job
✅ **Cache Fallback** - Shows last successful data if API fails
✅ **Real-time Metrics** - Total bookings, completed, no-shows
✅ **Conversion Tracking** - Meta Leads → Meeting bookings
✅ **Trend Analysis** - Meeting bookings over time

---

## Prerequisites

1. **Calendly Account** (Pro, Teams, or Enterprise)
2. **API Access** (available on all paid plans)
3. **Personal Access Token**

---

## Step 1: Create Calendly Personal Access Token

### 1.1 Navigate to API Settings

1. Log in to [Calendly](https://calendly.com)
2. Click your profile picture → **Settings**
3. Go to **Integrations** → **API & Webhooks**
4. Or visit directly: https://calendly.com/integrations/api_webhooks

### 1.2 Generate Personal Access Token

1. Click **"Get a token"** or **"Generate New Token"**
2. Give it a descriptive name: `Marketing Dashboard`
3. Copy the token immediately (you won't see it again!)
4. Store it securely

**Token format:** `eyJraWQi...` (long string)

---

## Step 2: Get Your User URI

You need your Calendly User URI to fetch events.

### Method 1: Via API (Recommended)

Use this curl command with your token:

```bash
curl --request GET \
  --url 'https://api.calendly.com/users/me' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  --header 'Content-Type: application/json'
```

**Response:**
```json
{
  "resource": {
    "uri": "https://api.calendly.com/users/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    "name": "Your Name",
    "slug": "your-calendly-slug",
    "email": "you@example.com",
    ...
  }
}
```

Copy the `uri` value.

### Method 2: Via Calendly Dashboard

1. Go to your Calendly account
2. Click on your profile
3. Your user URI format: `https://api.calendly.com/users/{UUID}`
4. The UUID is in your event URLs

---

## Step 3: Configure Environment Variables

Add these variables to your `.env.local` file:

```env
# Calendly API Configuration
CALENDLY_ACCESS_TOKEN=eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ...
CALENDLY_USER_URI=https://api.calendly.com/users/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

**Important:**
- Replace `YOUR_ACCESS_TOKEN` with your actual token
- Replace the User URI with yours
- Do NOT commit `.env.local` to git

---

## Step 4: Test the Integration

### 4.1 Start Development Server

```bash
npm run dev
```

### 4.2 Test API Endpoint Manually

```bash
curl http://localhost:3000/api/calendly/events
```

**Expected Response:**
```json
{
  "totalBooked": 42,
  "completed": 35,
  "noShows": 3,
  "conversionRate": 83.33,
  "dateRange": {
    "start": "2024-10-26",
    "end": "2024-11-26"
  },
  "lastUpdated": "2024-11-26T12:00:00.000Z",
  "events": [...],
  "invitees": [...]
}
```

### 4.3 Check Dashboard

1. Open http://localhost:3000
2. Scroll to **"Meeting Bookings"** section
3. Verify metrics display:
   - Total Bookings
   - Completed Meetings
   - No-Shows
   - Lead to Meeting Rate (if Meta Ads configured)

---

## Step 5: Verify Cron Job Integration

The cron job automatically refreshes Calendly data every 6 hours.

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
    "calendly": "fetched"
  },
  "cached": true
}
```

---

## How It Works

### Data Flow

1. **Cron Job** runs every 6 hours (12:01am, 6:01am, 12:01pm, 6:01pm)
2. **Fetches scheduled events** from Calendly API (last 30 days)
3. **Fetches invitee data** to identify no-shows and completions
4. **Calculates metrics:**
   - Total bookings = all scheduled events
   - Completed = past events where invitee showed up
   - No-shows = invitees marked as no-show
   - Conversion rate = (completed / total booked) × 100
5. **Stores in cache** (`.cache/metrics.json`)
6. **Dashboard displays** cached data via SWR

### API Endpoints Used

- **Scheduled Events:** `GET /scheduled_events`
- **Invitees:** `GET /scheduled_events/{uuid}/invitees`

### Metrics Calculated

```typescript
interface CalendlyMetrics {
  totalBooked: number;        // All scheduled events
  completed: number;          // Events where invitee showed up
  noShows: number;            // Events marked as no-show
  conversionRate: number;     // (completed / totalBooked) × 100
  dateRange: {
    start: string;            // YYYY-MM-DD
    end: string;              // YYYY-MM-DD
  };
}
```

---

## Troubleshooting

### Error: "Calendly API credentials not configured"

**Cause:** Missing or invalid environment variables

**Fix:**
1. Check `.env.local` has both variables set
2. Restart dev server: `npm run dev`
3. Verify token is valid (not expired)

### Error: "Calendly API error (401)"

**Cause:** Invalid or expired access token

**Fix:**
1. Generate a new Personal Access Token
2. Update `CALENDLY_ACCESS_TOKEN` in `.env.local`
3. Restart server

### Error: "No events found"

**Cause:** No scheduled events in the last 30 days, or wrong User URI

**Fix:**
1. Verify you have bookings in Calendly
2. Check `CALENDLY_USER_URI` is correct
3. Try fetching with different date range:
   ```bash
   curl "http://localhost:3000/api/calendly/events?startDate=2024-01-01&endDate=2024-12-31"
   ```

### Dashboard shows "Calendly Data Unavailable"

**Cause:** API failed, but cached data might be available

**Fix:**
1. Check console logs for error details
2. Trigger manual refresh
3. Verify API credentials
4. Wait for next automatic refresh (6 hours)

---

## Dashboard Features

### 1. Meeting Bookings KPIs

Four metric cards showing:
- **Total Bookings:** All meetings scheduled
- **Completed Meetings:** Successful meetings (with conversion %)
- **No-Shows:** Meetings where invitee didn't attend
- **Lead to Meeting Rate:** Conversion from WhatsApp → Calendly

### 2. Bookings Trend Chart

Line chart showing meeting bookings over time (last 14 days)

### 3. Conversion Tracking

Automatically calculates:
```
Lead to Meeting Rate = (Calendly Bookings / WhatsApp Conversations) × 100
```

This shows how well your Meta Ads leads convert to actual meetings.

---

## API Reference

### GET /api/calendly/events

Fetch Calendly meeting metrics.

**Query Parameters:**
- `startDate` (optional): `YYYY-MM-DD` (default: 30 days ago)
- `endDate` (optional): `YYYY-MM-DD` (default: today)

**Example:**
```bash
curl "http://localhost:3000/api/calendly/events?startDate=2024-11-01&endDate=2024-11-26"
```

**Response:**
```json
{
  "totalBooked": 42,
  "completed": 35,
  "noShows": 3,
  "conversionRate": 83.33,
  "dateRange": {
    "start": "2024-11-01",
    "end": "2024-11-26"
  },
  "lastUpdated": "2024-11-26T12:00:00.000Z"
}
```

---

## Rate Limits

**Calendly API Limits:**
- **100 requests per minute** per access token
- **10,000 requests per day**

**Dashboard Implementation:**
- Fetches data every 6 hours (4 times/day)
- Uses pagination (max 100 events per request)
- Well within rate limits

---

## Security Best Practices

### 1. Protect Your Token

- ✅ Store in `.env.local` (git ignored)
- ✅ Never commit to version control
- ✅ Rotate tokens periodically
- ❌ Don't expose in client-side code
- ❌ Don't share in screenshots/logs

### 2. Token Rotation

Rotate your Personal Access Token every 3-6 months:
1. Generate new token in Calendly
2. Update `.env.local`
3. Restart application
4. Delete old token from Calendly

### 3. Production Deployment

When deploying to Vercel:
1. Add environment variables in Vercel Dashboard
2. Set for **Production** environment
3. Redeploy after adding variables

---

## Advanced Configuration

### Custom Date Ranges

Fetch data for specific periods:

```typescript
// Last 90 days
const params = new URLSearchParams({
  startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0]
});

const response = await fetch(`/api/calendly/events?${params}`);
```

### Filter by Event Type

Currently fetches all event types. To filter specific event types, modify:

```typescript
// In /app/api/calendly/events/route.ts
const params = new URLSearchParams({
  user: userUri,
  min_start_time: minStartTime,
  max_start_time: maxStartTime,
  count: '100',
  status: 'active',
  // Add event type filter
  event_type: 'https://api.calendly.com/event_types/YOUR_EVENT_TYPE_UUID'
});
```

---

## FAQ

### Q: Can I track multiple Calendly users?

**A:** Currently supports one user. To track multiple users, you would need to:
1. Create separate API endpoints for each user
2. Aggregate data in the dashboard
3. Use organization-level API access

### Q: How far back does it fetch data?

**A:** Default is 30 days. You can adjust by passing `startDate` and `endDate` query parameters.

### Q: Does it track canceled meetings?

**A:** Yes, but they're excluded from "Completed" count. The API distinguishes between:
- Active events (scheduled)
- Canceled events (by host or invitee)
- No-shows (invitee didn't attend)

### Q: Can I get real-time notifications?

**A:** The dashboard refreshes every 6 hours. For real-time updates, you would need to:
1. Implement Calendly Webhooks
2. Listen for `invitee.created`, `invitee.canceled` events
3. Update cache immediately

### Q: What about timezone differences?

**A:** Calendly API returns all times in UTC (ISO 8601 format). The dashboard converts to local timezone automatically.

---

## Next Steps

After setting up Calendly integration:

1. ✅ **Monitor conversion rates** - Track lead-to-meeting performance
2. ✅ **Reduce no-shows** - Send reminder emails/SMS
3. ✅ **Optimize booking flow** - Test different Calendly links
4. ✅ **A/B test scheduling** - Compare different event types
5. ✅ **Set up alerts** - Get notified when no-show rate exceeds threshold

---

## Support

**Calendly API Documentation:**
- [Getting Started](https://developer.calendly.com/getting-started)
- [API Reference](https://developer.calendly.com/api-docs)
- [Authentication](https://developer.calendly.com/how-to-authenticate-with-personal-access-tokens)

**Dashboard Documentation:**
- Setup: `DASHBOARD_SETUP.md`
- Deployment: `FINAL_DEPLOYMENT_CHECKLIST.md`
- Troubleshooting: See main README.md

**Common Issues:**
- Token expired → Generate new token
- No data showing → Check User URI is correct
- Rate limit errors → Reduce API call frequency

---

**Last Updated:** 2025-11-26
**Version:** 1.0.0
**Status:** Production Ready ✅

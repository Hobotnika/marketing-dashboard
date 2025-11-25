# Google Ads Marketing Dashboard - Setup Guide

## Overview

This dashboard integrates with the Google Ads API to fetch and display real-time marketing metrics including impressions, clicks, CTR, and ad spend.

## Features

- **Real-time metrics**: Fetches data from Google Ads API
- **Auto-refresh**: Updates every 5 minutes automatically
- **Error handling**: Falls back to cached data if API fails
- **Caching**: 15-minute cache to reduce API calls
- **Responsive design**: Works on desktop and mobile
- **Dark mode support**: Automatically adapts to system theme

## Prerequisites

1. **Google Ads Account** with API access
2. **Google Cloud Project** with Google Ads API enabled
3. **OAuth2 credentials** (Client ID and Secret)
4. **Developer Token** from Google Ads
5. **Refresh Token** from OAuth2 flow

## Setup Steps

### 1. Enable Google Ads API

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Ads API**
4. Navigate to **APIs & Services** → **Credentials**

### 2. Create OAuth2 Credentials

1. Click **Create Credentials** → **OAuth 2.0 Client ID**
2. Choose **Web application** as the application type
3. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - Your production URL
4. Save the **Client ID** and **Client Secret**

### 3. Get Developer Token

1. Go to [Google Ads API Center](https://ads.google.com/aw/apicenter)
2. Apply for a developer token
3. Note: You can use a test account token for development

### 4. Get Customer ID

1. Log in to your Google Ads account
2. Click on the **Tools & Settings** icon
3. Under **Setup**, click **Settings**
4. Your Customer ID is displayed at the top (format: XXX-XXX-XXXX)
5. **Remove the dashes** when adding to .env.local

### 5. Obtain Refresh Token

You need to complete the OAuth2 flow to get a refresh token. Here's a simple way:

#### Option A: Using Google OAuth2 Playground

1. Go to [OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in the top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In the left panel, scroll to **Google Ads API v18**
6. Select `https://www.googleapis.com/auth/adwords`
7. Click **Authorize APIs**
8. Complete the authorization flow
9. Click **Exchange authorization code for tokens**
10. Copy the **refresh_token** value

#### Option B: Using a Script

Create a file `get-refresh-token.js`:

```javascript
const readline = require('readline');
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost:3000'
);

const scopes = ['https://www.googleapis.com/auth/adwords'];
const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Visit this URL to authorize:', url);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from the URL: ', async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log('Refresh Token:', tokens.refresh_token);
  rl.close();
});
```

Run: `node get-refresh-token.js`

### 6. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your credentials:
   ```env
   GOOGLE_ADS_CLIENT_ID=your_client_id_here
   GOOGLE_ADS_CLIENT_SECRET=your_client_secret_here
   GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_here
   GOOGLE_ADS_CUSTOMER_ID=1234567890
   GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token_here
   ```

### 7. Install Dependencies and Run

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your dashboard.

## API Endpoints

### GET /api/google-ads/metrics

Fetches Google Ads metrics for the last 30 days.

**Response:**
```json
{
  "success": true,
  "data": {
    "impressions": 150000,
    "clicks": 3500,
    "ctr": 2.33,
    "spend": 1250.50,
    "dateRange": {
      "start": "2025-10-26",
      "end": "2025-11-25"
    }
  },
  "cached": false
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Cached Response:**
```json
{
  "success": true,
  "data": { ... },
  "cached": true,
  "cachedAt": "2025-11-25T12:00:00.000Z"
}
```

## Caching Strategy

- **Cache Duration**: 15 minutes
- **Fallback**: If API fails, returns cached data if available
- **Auto-refresh**: Dashboard refreshes every 5 minutes
- **Manual Refresh**: Click the "Refresh Metrics" button

## Error Handling

The dashboard handles errors gracefully:

1. **Missing credentials**: Shows error message with setup instructions
2. **API failure**: Falls back to cached data if available
3. **No cached data**: Shows error message with details
4. **Network issues**: Displays user-friendly error message

## Troubleshooting

### "Missing environment variables" Error

- Ensure all required variables are set in `.env.local`
- Restart the dev server after changing `.env.local`

### "Authentication failed" Error

- Verify your OAuth2 credentials are correct
- Check if your refresh token is still valid
- Ensure the Google Ads API is enabled in your project

### "Invalid customer ID" Error

- Remove dashes from the customer ID
- Verify you have access to the Google Ads account
- Ensure the customer ID matches your account

### No Data Showing

- Check browser console for errors
- Verify your Google Ads account has data for the last 30 days
- Test the API endpoint directly: `http://localhost:3000/api/google-ads/metrics`

## Production Deployment

### Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Ensure your platform supports:
- Node.js 18+
- Environment variables
- Next.js API routes

## Security Notes

- **Never commit** `.env.local` to version control
- Keep your **developer token** secret
- Rotate credentials regularly
- Use **test accounts** for development

## API Rate Limits

Google Ads API has rate limits:
- **Basic access**: 15,000 operations per day
- **Standard access**: Higher limits after approval

The dashboard's caching strategy helps stay within limits.

## Customization

### Change Date Range

Edit `app/api/google-ads/metrics/route.ts`:

```typescript
function getDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 90); // Change to 90 days
  return { start: formatDate(start), end: formatDate(end) };
}
```

### Add More Metrics

Query additional metrics in the API route:

```typescript
const query = `
  SELECT
    metrics.impressions,
    metrics.clicks,
    metrics.ctr,
    metrics.cost_micros,
    metrics.conversions,
    metrics.conversion_rate
  FROM campaign
  WHERE segments.date BETWEEN '${dateRange.start}' AND '${dateRange.end}'
`;
```

### Change Cache Duration

Edit `lib/cache.ts`:

```typescript
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
```

## Resources

- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/start)
- [google-ads-api NPM Package](https://www.npmjs.com/package/google-ads-api)
- [OAuth2 Setup Guide](https://developers.google.com/google-ads/api/docs/oauth/overview)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Google Ads API documentation
3. Check browser console for detailed errors
4. Verify all environment variables are correct

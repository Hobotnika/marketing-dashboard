# Multi-Platform Marketing Dashboard

A modern, real-time marketing dashboard built with Next.js that integrates with Google Ads and Meta (Facebook) Ads APIs to display comprehensive campaign performance metrics.

## Features

### Google Ads Integration
- **Real-time Metrics**: Live data from Google Ads campaigns
- **Key Metrics**: Impressions, Clicks, CTR, Ad Spend
- **OAuth2 Authentication**: Secure refresh token-based auth

### Meta Ads Integration
- **Multi-Campaign Support**: Track multiple campaigns simultaneously
- **WhatsApp Metrics**: Monitor WhatsApp conversations started
- **Cost Analysis**: Automatic cost per conversation/lead calculations
- **Campaign Breakdown**: Individual performance cards per campaign
- **Comprehensive Metrics**: Reach, Impressions, Conversions, Spend

### Dashboard Features
- **Multi-Platform View**: See Google and Meta metrics side-by-side
- **Auto-refresh**: Updates every 5 minutes automatically
- **Error Handling**: Graceful fallback to cached data
- **Smart Caching**: 15-minute cache to optimize API usage
- **Responsive Design**: Works beautifully on desktop and mobile
- **Dark Mode**: Automatic theme detection

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Google Ads API** - Google advertising data
- **Meta Marketing API** - Facebook/Instagram/WhatsApp ad data
- **React 19** - UI components

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Credentials

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API credentials:

```env
# Google Ads API
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CUSTOMER_ID=your_customer_id
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token

# Meta Ads API
META_ACCESS_TOKEN=your_meta_access_token
META_AD_ACCOUNT_ID=act_your_account_id
```

**Need help getting credentials?**
- Google Ads: See [SETUP.md](./SETUP.md)
- Meta Ads: See [META_SETUP.md](./META_SETUP.md)

### 3. Test Your Connections

Test Google Ads:
```bash
npm run test:google
```

Test Meta Ads:
```bash
npm run test:meta
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your dashboard.

## Project Structure

```
marketing-dashboard/
├── app/
│   ├── api/
│   │   ├── google-ads/
│   │   │   └── metrics/
│   │   │       └── route.ts          # Google Ads API endpoint
│   │   └── meta-ads/
│   │       └── metrics/
│   │           └── route.ts          # Meta Ads API endpoint
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Main dashboard page
├── components/
│   ├── MetricsCard.tsx               # Reusable metric card
│   └── CampaignCard.tsx              # Campaign detail card
├── lib/
│   └── cache.ts                      # Caching utility
├── scripts/
│   ├── test-connection.ts            # Google Ads test
│   └── test-meta-connection.ts       # Meta Ads test
├── types/
│   ├── google-ads.ts                 # Google Ads types
│   └── meta-ads.ts                   # Meta Ads types
├── .env.example                      # Example environment variables
├── .env.local                        # Your credentials (git-ignored)
├── SETUP.md                          # Google Ads setup guide
└── META_SETUP.md                     # Meta Ads setup guide
```

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
  }
}
```

### GET /api/meta-ads/metrics

Fetches Meta Ads campaign metrics with WhatsApp conversation data.

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
        "whatsappConversations": 150,
        "spend": 800.00,
        "avgCostPerConversation": 5.33,
        "status": "ACTIVE"
      }
    ]
  }
}
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test:google` - Test Google Ads API connection
- `npm run test:meta` - Test Meta Ads API connection

## Metrics Tracked

### Google Ads
| Metric | Description |
|--------|-------------|
| **Impressions** | Total ad impressions |
| **Clicks** | Total ad clicks |
| **CTR** | Click-through rate (%) |
| **Spend** | Total ad spend (USD) |

### Meta Ads
| Metric | Description |
|--------|-------------|
| **Reach** | Unique users reached |
| **Impressions** | Total times ads shown |
| **WhatsApp Conversations** | Conversations started |
| **Cost per Conversation** | Average cost per conversation |
| **Leads** | Total leads generated (if available) |
| **Cost per Lead** | Average cost per lead |
| **Spend** | Total ad spend (USD) |

## Configuration

### Cache Duration

Default: 15 minutes. Modify in `lib/cache.ts`:

```typescript
const CACHE_TTL = 15 * 60 * 1000; // milliseconds
```

### Date Range

Default: Last 30 days. Modify in respective API routes:

```typescript
function getDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30); // Change this
  return { start: formatDate(start), end: formatDate(end) };
}
```

### Auto-refresh Interval

Default: 5 minutes. Modify in `app/page.tsx`:

```typescript
const interval = setInterval(fetchAllMetrics, 5 * 60 * 1000);
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in project settings:
   - All `GOOGLE_ADS_*` variables
   - All `META_*` variables
4. Deploy

### Environment Variables in Production

Required variables:
```
GOOGLE_ADS_CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET
GOOGLE_ADS_DEVELOPER_TOKEN
GOOGLE_ADS_CUSTOMER_ID
GOOGLE_ADS_REFRESH_TOKEN
META_ACCESS_TOKEN
META_AD_ACCOUNT_ID
```

## Troubleshooting

### Google Ads Issues

Run diagnostics:
```bash
npm run test:google
```

Common issues:
- **"Missing environment variables"**: Check `.env.local` exists
- **"invalid_grant"**: Refresh token expired - regenerate
- **"PERMISSION_DENIED"**: Customer ID incorrect or no access

See [SETUP.md](./SETUP.md) for detailed troubleshooting.

### Meta Ads Issues

Run diagnostics:
```bash
npm run test:meta
```

Common issues:
- **"Invalid OAuth"**: Access token expired - regenerate
- **"Unsupported get request"**: Ad Account ID format incorrect (use `act_123456789`)
- **"Insufficient permissions"**: Token needs `ads_read` and `ads_management` permissions

See [META_SETUP.md](./META_SETUP.md) for detailed troubleshooting.

### General Issues

1. **Dashboard shows no data**: Run test scripts to diagnose
2. **API rate limits**: Increase cache duration
3. **Stale data**: Decrease cache duration or click "Refresh All"

## Resources

### Documentation
- [SETUP.md](./SETUP.md) - Google Ads setup guide
- [META_SETUP.md](./META_SETUP.md) - Meta Ads setup guide
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details

### API Documentation
- [Google Ads API](https://developers.google.com/google-ads/api/docs/start)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [Next.js Documentation](https://nextjs.org/docs)

### Tools
- [Google OAuth2 Playground](https://developers.google.com/oauthplayground/)
- [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Meta Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)

## Security

- Never commit `.env.local` to version control
- Keep API tokens and secrets secure
- Use system user tokens for Meta in production
- Rotate credentials regularly
- Use minimum required permissions

## Performance

- **Initial load**: ~1-2s (API calls)
- **Cached load**: ~50-100ms (cache hit)
- **Auto-refresh**: Every 5 minutes
- **API calls**: Max 8 per hour (with cache)

## Support

For issues or questions:
1. Check troubleshooting sections above
2. Run diagnostic scripts (`test:google`, `test:meta`)
3. Review API documentation
4. Check browser console for errors

## License

This project is open source and available under the MIT License.

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS

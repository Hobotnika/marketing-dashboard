# Alert System and PDF Export - Documentation

## Overview

The marketing dashboard now includes advanced features for anomaly detection, automated notifications, and PDF report generation. These features help you stay informed about campaign performance issues and generate professional reports.

## Features

### 1. **PDF Report Export**
- Generate comprehensive PDF reports with all metrics
- Includes Google Ads and Meta Ads performance data
- Professional formatting with charts and summary
- Downloadable with a single click

### 2. **Anomaly Detection**
- Automatic detection of performance issues
- Configurable thresholds for different alert types
- Historical data comparison (24-hour intervals)
- Severity levels: Low, Medium, High

### 3. **Multi-Channel Notifications**
- Email notifications via Resend API
- Slack notifications via webhooks
- Actionable alerts with direct dashboard links
- Rich formatting with metrics and context

---

## Architecture

```
┌─────────────────┐
│  Vercel Cron    │  Every 6 hours
│  (Automatic)    │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────┐
│  /api/cron/refresh-metrics       │
│  1. Fetch Google & Meta metrics  │
│  2. Store in persistent cache    │
│  3. Store historical data        │
│  4. Detect anomalies             │
│  5. Send notifications           │
└────────┬─────────────────────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌────────────────┐  ┌──────────────────┐
│  Email (Resend)│  │  Slack (Webhook) │
│  - Recipients  │  │  - Channel       │
│  - HTML format │  │  - Rich blocks   │
└────────────────┘  └──────────────────┘
```

---

## Alert Types

### 1. Spend Increase Alert
**Trigger:** Ad spend increases by >30% without proportional conversion increase

**Detection Logic:**
- Compare current spend vs. 24 hours ago
- Compare current conversions vs. 24 hours ago
- Alert if spend increase > threshold AND conversions increase < 50% of spend increase

**Example:**
```
Spend increased: +40%
Conversions increased: +10%
Result: 🔴 HIGH ALERT - Inefficient spending
```

### 2. CTR Drop Alert
**Trigger:** Click-through rate falls below 2.0%

**Detection Logic:**
- Check if current CTR < configured threshold
- Alert with severity based on how far below threshold

**Example:**
```
Current CTR: 1.5%
Threshold: 2.0%
Result: 🟡 MEDIUM ALERT - Low engagement
```

### 3. Conversion Drop Alert
**Trigger:** Conversions decrease by >20%

**Detection Logic:**
- Compare current conversions vs. 24 hours ago
- Alert if decrease exceeds threshold percentage

**Example:**
```
Previous conversions: 250
Current conversions: 180
Change: -28%
Result: 🔴 HIGH ALERT - Significant conversion drop
```

### 4. Cost Per Conversation Increase
**Trigger:** Average cost per conversation increases by >25%

**Detection Logic:**
- Compare current avg cost vs. 24 hours ago
- Alert if increase exceeds threshold percentage

**Example:**
```
Previous cost: $5.20
Current cost: $7.15
Change: +37.5%
Result: 🔴 HIGH ALERT - Rising costs
```

---

## Configuration

### Alert Settings Page

Access at: `/settings/alerts`

#### Alert Thresholds

Each alert type has:
- **Enable/Disable Toggle** - Turn alerts on/off
- **Threshold Value** - Customize sensitivity (percentage or absolute)
- **Description** - Explains what triggers the alert

**Example Configuration:**
```
✓ Spend Increase Alert
  Threshold: 30%

✓ CTR Drop Alert
  Threshold: 2.0%

✓ Conversion Drop Alert
  Threshold: 20%

✓ Cost Per Conversation Increase
  Threshold: 25%
```

#### Email Notifications

**Setup:**
1. Toggle "Enable email notifications"
2. Add recipient email addresses
3. Configure RESEND_API_KEY in environment variables

**Features:**
- Multiple recipients supported
- HTML-formatted emails with metrics
- Direct link to dashboard
- Severity color coding

**Email Template Preview:**
```
Subject: ⚠️ HIGH Alert: Meta Ads: Spend Increase Without Proportional Conversions

🔴 Meta Ads: Spend Increase Without Proportional Conversions

Ad spend increased by 42.3% but conversations only increased by 15.2%.
Campaign performance may be declining.

Previous Value: $1,250.00
Current Value: $1,778.75
Change: +42.3%

Platform: Meta Ads
Detected at: Nov 25, 2025, 12:01 PM
Severity: HIGH

[View Dashboard →]
```

#### Slack Notifications

**Setup:**
1. Create Slack Incoming Webhook:
   - Visit https://api.slack.com/messaging/webhooks
   - Create new webhook for your channel
   - Copy webhook URL
2. Toggle "Enable Slack notifications"
3. Paste webhook URL in settings

**Features:**
- Rich message formatting with Slack Blocks
- Severity color coding (red, yellow, blue)
- Inline metrics display
- Direct dashboard link button

**Slack Message Preview:**
```
🔴 Marketing Alert: Meta Ads: Spend Increase Without Proportional Conversions

Ad spend increased by 42.3% but conversations only increased by 15.2%.
Campaign performance may be declining.

Platform: Meta Ads          | Severity: HIGH
Previous Value: $1,250.00   | Current Value: $1,778.75
Change: +42.3%              | Detected: Nov 25, 2025 12:01 PM

[View Dashboard]
```

---

## PDF Export

### How to Export

1. Click **"Export PDF"** button in dashboard header
2. PDF generates automatically
3. Downloads as `marketing-report-YYYY-MM-DD.pdf`

### PDF Contents

**Header Section:**
- Report title and subtitle
- Generation date and time

**Executive Summary:**
- Total ad spend across platforms
- Total conversions
- Reporting period

**Google Ads Performance:**
- Impressions
- Click-Through Rate
- Total Clicks
- Ad Spend

**Meta Ads Performance:**
- Total Reach
- WhatsApp Conversations
- Cost per Conversation
- Ad Spend
- Campaign Breakdown (top 5 campaigns)

**Footer:**
- Auto-generated timestamp
- Last data update time

### PDF Customization

The PDF report can be customized by editing:
- `components/PDFReport.tsx` - Layout and styling
- Modify `styles` object for colors, fonts, spacing
- Add/remove sections as needed

---

## Environment Variables

### Required for Notifications

```env
# Email Notifications (via Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx

# Slack Notifications (configured in UI)
# No environment variable needed - set webhook in settings page

# Dashboard URL (for notification links)
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

### Getting a Resend API Key

1. Sign up at https://resend.com
2. Verify your domain (or use sandbox for testing)
3. Navigate to API Keys section
4. Create new API key
5. Copy key to `.env.local` as `RESEND_API_KEY`

**Note:** Sandbox mode allows 100 emails/day to verified addresses.

---

## How It Works

### Anomaly Detection Flow

```
1. Cron job runs every 6 hours
   ↓
2. Fetch current metrics from APIs
   ↓
3. Store in persistent cache (.cache/metrics.json)
   ↓
4. Store in historical data (.cache/metrics-history.json)
   ↓
5. Compare with metrics from ~24 hours ago
   ↓
6. Check each enabled threshold
   ↓
7. Generate anomaly objects for violations
   ↓
8. Send notifications via enabled channels
```

### Historical Data Storage

- Metrics stored every 6 hours
- Retention: Last 7 days (28 data points)
- File: `.cache/metrics-history.json`
- Automatic cleanup of old records

### Notification Deduplication

Currently, notifications are sent every time an anomaly is detected. For production, consider:
- Tracking sent alerts to prevent duplicates
- Cooldown period (e.g., 24 hours between same alert)
- Severity-based frequency (high = immediate, low = daily digest)

---

## API Reference

### GET /api/settings/alerts

Retrieve current alert settings.

**Response:**
```json
{
  "success": true,
  "settings": {
    "thresholds": [
      {
        "id": "spend-increase",
        "name": "Spend Increase Alert",
        "type": "spend_increase",
        "enabled": true,
        "threshold": 30,
        "description": "Alert when ad spend increases..."
      }
    ],
    "notificationChannels": {
      "email": {
        "enabled": true,
        "recipients": ["admin@example.com"]
      },
      "slack": {
        "enabled": true,
        "webhookUrl": "https://hooks.slack.com/..."
      }
    },
    "dashboardUrl": "https://your-app.vercel.app"
  }
}
```

### POST /api/settings/alerts

Update alert settings.

**Request Body (Update Threshold):**
```json
{
  "action": "update-threshold",
  "data": {
    "thresholdId": "spend-increase",
    "enabled": true,
    "threshold": 35
  }
}
```

**Request Body (Update Notifications):**
```json
{
  "action": "update-notifications",
  "data": {
    "notificationChannels": {
      "email": {
        "enabled": true,
        "recipients": ["admin@example.com", "team@example.com"]
      },
      "slack": {
        "enabled": false,
        "webhookUrl": ""
      }
    }
  }
}
```

**Request Body (Update All):**
```json
{
  "action": "update-all",
  "data": {
    "settings": { /* full AlertSettings object */ }
  }
}
```

---

## Testing

### Test Email Notifications

```bash
# 1. Set up Resend API key in .env.local
RESEND_API_KEY=re_your_key_here

# 2. Configure email in settings page
# Visit: http://localhost:3000/settings/alerts
# Enable email notifications
# Add your email address

# 3. Trigger manual refresh to test
# (Requires sufficient historical data for comparison)
```

### Test Slack Notifications

```bash
# 1. Create Slack webhook
# Visit: https://api.slack.com/messaging/webhooks

# 2. Configure in settings page
# Visit: http://localhost:3000/settings/alerts
# Enable Slack notifications
# Paste webhook URL

# 3. Trigger manual refresh
```

### Test PDF Export

```bash
# 1. Start dev server
npm run dev

# 2. Load dashboard with data
# Visit: http://localhost:3000

# 3. Click "Export PDF" button
# PDF should download automatically
```

### Simulate Anomalies

To test anomaly detection without waiting 24 hours:

1. Manually edit `.cache/metrics-history.json`
2. Add a historical record with different values
3. Trigger manual refresh via dashboard
4. Check console logs for anomaly detection

**Example Historical Record:**
```json
[
  {
    "google": {
      "impressions": 100000,
      "clicks": 2000,
      "ctr": 2.0,
      "spend": 1000,
      "dateRange": {
        "start": "2025-10-26",
        "end": "2025-11-25"
      }
    },
    "meta": {
      "campaigns": [],
      "totals": {
        "reach": 30000,
        "whatsappConversations": 150,
        "spend": 800,
        "avgCostPerConversation": 5.33,
        "dateRange": {
          "start": "2025-10-26",
          "end": "2025-11-25"
        }
      }
    },
    "timestamp": "2025-11-24T12:01:00.000Z"
  }
]
```

---

## Troubleshooting

### Email Notifications Not Sending

**Check:**
1. `RESEND_API_KEY` is set in environment variables
2. API key is valid (check Resend dashboard)
3. Recipients are added in settings
4. Email notifications are enabled
5. Domain is verified (or using sandbox mode)

**Logs:**
```bash
vercel logs /api/cron/refresh-metrics --follow
# Look for: [NOTIFICATIONS] Email sent to...
```

### Slack Notifications Not Sending

**Check:**
1. Webhook URL is correct
2. Webhook is active in Slack workspace
3. Slack notifications are enabled in settings
4. Network connectivity to Slack API

**Test Webhook:**
```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message"}'
```

### No Anomalies Detected

**Reasons:**
1. Not enough historical data (need 2+ data points)
2. No significant changes in metrics
3. All thresholds are disabled
4. Threshold values are too high

**Check Historical Data:**
```bash
cat .cache/metrics-history.json | jq length
# Should return 2 or more
```

### PDF Export Not Working

**Check:**
1. Browser supports PDF download
2. Data is loaded (googleData and metaData not null)
3. Check browser console for errors
4. Try different browser

**Common Issues:**
- AdBlockers may block PDF generation
- Popup blockers may prevent download
- Insufficient data to generate report

---

## Best Practices

### Threshold Configuration

- **Start Conservative:** Begin with higher thresholds (30-40%)
- **Monitor False Positives:** Adjust if getting too many alerts
- **Seasonal Adjustments:** Increase thresholds during high-activity periods
- **Test Changes:** Use manual refresh to test new thresholds

### Notification Management

- **Email:** Use for important alerts and stakeholders
- **Slack:** Use for team collaboration and real-time awareness
- **Avoid Alert Fatigue:** Don't enable every alert for everyone
- **Group Recipients:** Create distribution lists for different teams

### Report Generation

- **Regular Exports:** Generate weekly/monthly reports for records
- **Share with Stakeholders:** Email PDF reports to non-technical users
- **Compare Periods:** Export multiple periods for trend analysis
- **Automate:** Consider adding scheduled PDF generation to cron job

---

## Future Enhancements

Planned features:

- [ ] Alert cooldown periods to prevent duplicate notifications
- [ ] Daily/weekly digest emails with summary of all anomalies
- [ ] Custom alert formulas (combine multiple metrics)
- [ ] Alert history dashboard
- [ ] Webhook support for custom integrations
- [ ] SMS notifications via Twilio
- [ ] Microsoft Teams integration
- [ ] Scheduled PDF report generation
- [ ] Multi-language PDF reports
- [ ] Chart generation in PDF (currently only metrics)

---

## Support

### Documentation
- Main README: `README.md`
- Cron System: `CRON_DOCUMENTATION.md`
- Charts: `CHARTS_DOCUMENTATION.md`

### Troubleshooting
- Check Vercel function logs
- Review `.cache/` directory contents
- Test API endpoints manually
- Verify environment variables

### External Resources
- Resend Docs: https://resend.com/docs
- Slack Webhooks: https://api.slack.com/messaging/webhooks
- React PDF: https://react-pdf.org/

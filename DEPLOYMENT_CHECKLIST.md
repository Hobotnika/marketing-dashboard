# Deployment Checklist - Marketing Dashboard

## Pre-Deployment Setup

### 1. Environment Variables Configuration

Before deploying to Vercel, ensure all environment variables are set in the Vercel Dashboard:

#### Required Variables:

**Google Ads API:**
- [ ] `GOOGLE_ADS_CLIENT_ID` - OAuth2 client ID
- [ ] `GOOGLE_ADS_CLIENT_SECRET` - OAuth2 client secret
- [ ] `GOOGLE_ADS_DEVELOPER_TOKEN` - Developer token from Google Ads API Center
- [ ] `GOOGLE_ADS_CUSTOMER_ID` - Your Google Ads customer ID (format: 123-456-7890)
- [ ] `GOOGLE_ADS_REFRESH_TOKEN` - OAuth2 refresh token (obtain using scripts/test-connection.ts)

**Meta Ads API:**
- [ ] `META_ACCESS_TOKEN` - Long-lived access token from Meta Business
- [ ] `META_AD_ACCOUNT_ID` - Your Meta Ad Account ID (format: act_123456789)

**Cron System:**
- [ ] `CRON_SECRET` - Secret for Vercel Cron authentication (generate unique random string)
- [ ] `API_SECRET_KEY` - Secret for manual refresh (generate unique random string)
- [ ] `NEXT_PUBLIC_BASE_URL` - Your production URL (e.g., https://your-app.vercel.app)

### 2. Generate Secure Secrets

Run these commands to generate secure secrets:

```bash
# Generate CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate API_SECRET_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important:** Save these secrets securely. You'll need `API_SECRET_KEY` for manual refresh.

### 3. Verify Local Configuration

- [ ] Test Google Ads connection: `npx tsx scripts/test-connection.ts`
- [ ] Test Meta Ads connection: `npx tsx scripts/test-meta-connection.ts`
- [ ] Test cache system: `npx tsx scripts/test-cron-system.ts`
- [ ] Verify `vercel.json` exists in project root
- [ ] Ensure `.cache/` directory is in `.gitignore`

## Deployment Steps

### Step 1: Initial Deployment

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to Vercel
vercel deploy --prod
```

### Step 2: Configure Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add all variables listed above
5. Select **Production**, **Preview**, and **Development** environments
6. Save changes

### Step 3: Verify Cron Job Configuration

1. In Vercel Dashboard, go to your project
2. Navigate to **Crons** tab
3. Verify cron job appears:
   - Path: `/api/cron/refresh-metrics`
   - Schedule: `1 0,6,12,18 * * *`
   - Status: Active

### Step 4: Test Cron Endpoint

**Option A: Use Vercel's "Run Now" Button**
1. Go to Vercel Dashboard → Crons
2. Click "Run Now" next to your cron job
3. Check execution logs for success/errors

**Option B: Manual Test with cURL**
```bash
curl -X POST https://your-app.vercel.app/api/cron/refresh-metrics \
  -H "x-api-key: YOUR_API_SECRET_KEY"
```

### Step 5: Verify Data Flow

1. Visit your deployed dashboard: `https://your-app.vercel.app`
2. Check for "Last Updated" timestamp in header
3. Verify metrics are displaying correctly
4. Test "Force Refresh" button (requires API_SECRET_KEY)

## Post-Deployment Verification

### Check Cache File Persistence

In Vercel, the `.cache/` directory needs special handling:

**Option A: Use Vercel KV or Database (Recommended for Production)**
- Upgrade from file-based cache to database (see CRON_DOCUMENTATION.md)

**Option B: Verify File Persistence**
- Check Vercel function logs to ensure cache writes succeed
- Note: File system is ephemeral; cache may reset between deployments

### Monitor Cron Execution

1. **View Execution History:**
   - Vercel Dashboard → Project → Crons
   - Check execution timestamps and status (Success/Failed)

2. **View Function Logs:**
   ```bash
   vercel logs /api/cron/refresh-metrics --follow
   ```

3. **Look for these log messages:**
   - `[CRON] Starting metrics refresh...`
   - `[CRON] Fetching Google Ads metrics...`
   - `[CRON] Fetching Meta Ads metrics...`
   - `[CRON] Successfully cached metrics`

### Test Manual Refresh

1. Visit your dashboard
2. Click "Force Refresh" button
3. Enter `API_SECRET_KEY` when prompted
4. Verify dashboard updates within 1-2 seconds
5. Check "Last Updated" timestamp changed

## Troubleshooting

### Cron Not Running

**Symptoms:** Data never updates, old timestamp

**Solutions:**
- [ ] Verify `vercel.json` is committed to repository
- [ ] Check Vercel Dashboard → Crons shows the job
- [ ] Verify `CRON_SECRET` is set correctly
- [ ] Redeploy with `vercel deploy --prod --force`

### Authentication Errors (401 Unauthorized)

**Symptoms:** Cron logs show "Unauthorized"

**Solutions:**
- [ ] Verify `CRON_SECRET` matches in Vercel environment variables
- [ ] Check Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` header
- [ ] For manual refresh, verify `API_SECRET_KEY` is correct

### API Errors (Google/Meta)

**Symptoms:** Dashboard shows warnings or errors

**Check:**
- [ ] Google Ads refresh token is valid (tokens expire after 6 months of inactivity)
- [ ] Meta access token is long-lived (60-90 days)
- [ ] API credentials are correct in Vercel environment variables
- [ ] Ad account IDs are correct (Google: 123-456-7890, Meta: act_123456789)

**View Errors:**
```bash
# Check function logs
vercel logs /api/cron/refresh-metrics --since 1h

# Or visit dashboard - errors shown in UI
```

### Rate Limiting (429 Too Many Requests)

**Symptoms:** "Rate limit exceeded" error

**Solutions:**
- [ ] Wait 1 hour before retrying
- [ ] Don't call manual refresh multiple times rapidly
- [ ] Use scheduled cron instead of manual refresh

### Cache Not Persisting

**Symptoms:** Data resets after redeployment

**This is expected on Vercel's ephemeral file system.**

**Solutions:**
1. **Upgrade to Database (Recommended):**
   - Use Vercel Postgres, Redis, or KV
   - See CRON_DOCUMENTATION.md § "Upgrading to Database"

2. **Accept Ephemeral Cache:**
   - Cache rebuilds on first cron run after deployment
   - Data persists during normal operation

## Production Optimization

### Enable Analytics

- [ ] Add Vercel Analytics: `npm install @vercel/analytics`
- [ ] Track cron execution success rates
- [ ] Monitor dashboard page views

### Set Up Alerts

- [ ] Configure Vercel Integration for Slack/Discord
- [ ] Alert on cron job failures
- [ ] Alert on API errors

### Performance Monitoring

- [ ] Check function execution time (should be < 10s)
- [ ] Monitor API response times
- [ ] Track cache hit rates

### Security Hardening

- [ ] Rotate `CRON_SECRET` and `API_SECRET_KEY` monthly
- [ ] Use different secrets for staging/production
- [ ] Never commit secrets to git
- [ ] Consider IP allowlist for manual refresh endpoint

## Maintenance

### Monthly Tasks

- [ ] Verify cron job still running (check execution history)
- [ ] Check API rate limits haven't been exceeded
- [ ] Review function logs for errors
- [ ] Rotate secrets if required by policy

### Quarterly Tasks

- [ ] Refresh Google Ads OAuth token (if approaching 6 months inactivity)
- [ ] Renew Meta long-lived access token (60-90 day expiry)
- [ ] Review and update dependencies: `npm outdated`
- [ ] Test disaster recovery (delete cache, verify rebuild)

## Emergency Procedures

### Cron Stopped Working

1. Check Vercel Status: https://www.vercel-status.com/
2. Manually trigger refresh:
   ```bash
   curl -X POST https://your-app.vercel.app/api/cron/refresh-metrics \
     -H "x-api-key: YOUR_API_SECRET_KEY"
   ```
3. Check function logs for errors
4. Redeploy if necessary: `vercel deploy --prod --force`

### API Credentials Compromised

1. Immediately rotate compromised credentials
2. Update Vercel environment variables
3. Redeploy: `vercel deploy --prod`
4. Generate new secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Dashboard Down

1. Check Vercel deployment status
2. Review recent commits for breaking changes
3. Rollback to previous deployment in Vercel Dashboard
4. Check function logs: `vercel logs --follow`

## Success Criteria

Your deployment is successful when:

- [ ] Dashboard loads at production URL
- [ ] "Last Updated" shows recent timestamp (< 6 hours)
- [ ] Google Ads metrics display correctly
- [ ] Meta Ads campaigns display with WhatsApp conversations
- [ ] Cron job shows successful executions every 6 hours
- [ ] Force Refresh button works with API key
- [ ] No errors in Vercel function logs
- [ ] Cache persists between cron executions

## Next Steps After Deployment

1. **Document your API_SECRET_KEY** in secure password manager
2. **Share dashboard URL** with stakeholders
3. **Set up monitoring alerts** for cron failures
4. **Schedule monthly maintenance** check
5. **Consider database upgrade** for historical data tracking

---

**Need Help?**

- Vercel Documentation: https://vercel.com/docs
- Google Ads API: https://developers.google.com/google-ads/api
- Meta Marketing API: https://developers.facebook.com/docs/marketing-apis
- Project Documentation: See CRON_DOCUMENTATION.md

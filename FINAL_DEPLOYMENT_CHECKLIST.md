# Final Deployment Checklist

Complete this checklist before deploying the marketing dashboard to production.

---

## Pre-Deployment Tests

### ✅ 1. API Connections

- [ ] **Google Ads API**
  - [ ] Client ID configured
  - [ ] Client Secret configured
  - [ ] Developer Token configured
  - [ ] Customer ID configured
  - [ ] Refresh Token generated and valid
  - [ ] Test connection: `npx tsx scripts/test-connection.ts`
  - [ ] API returns valid data (impressions, clicks, CTR, spend)

- [ ] **Meta Ads API**
  - [ ] Access Token configured (long-lived)
  - [ ] Ad Account ID configured (with `act_` prefix)
  - [ ] Test connection: `npx tsx scripts/test-meta-connection.ts`
  - [ ] API returns campaigns and metrics

- [ ] **Cached Metrics API**
  - [ ] `/api/metrics/cached` returns data
  - [ ] Timestamp is recent
  - [ ] Both Google and Meta data present

- [ ] **Alert Settings API**
  - [ ] `/api/settings/alerts` returns settings
  - [ ] Settings can be updated
  - [ ] Thresholds are configured

**Run All Tests:**
```bash
npm run dev  # In terminal 1
npx tsx scripts/test-all-apis.ts  # In terminal 2
```

**Expected:** All tests pass ✅

---

### ✅ 2. Cron Job System

- [ ] **Configuration**
  - [ ] `vercel.json` exists with cron configuration
  - [ ] Schedule is correct: `"1 0,6,12,18 * * *"`
  - [ ] CRON_SECRET is generated (64 characters)
  - [ ] API_SECRET_KEY is generated (64 characters)

- [ ] **Cache System**
  - [ ] `.cache/` directory exists
  - [ ] `.cache/metrics.json` can be written
  - [ ] `.cache/alert-settings.json` can be written
  - [ ] `.cache/metrics-history.json` for anomaly detection

- [ ] **Manual Test**
  - [ ] Force refresh works from dashboard
  - [ ] Data updates after manual refresh
  - [ ] No errors in console

**Test Command:**
```bash
# Test manual refresh
curl -X POST http://localhost:3000/api/cron/refresh-metrics \
  -H "x-api-key: YOUR_API_SECRET_KEY"
```

---

### ✅ 3. Dashboard Functionality

- [ ] **Homepage**
  - [ ] Loads without errors
  - [ ] Google Ads section displays
  - [ ] Meta Ads section displays
  - [ ] Charts render correctly
  - [ ] Skeleton loaders appear during loading
  - [ ] No console errors

- [ ] **Interactive Features**
  - [ ] Force Refresh button works
  - [ ] Export PDF button works
  - [ ] PDF downloads with correct data
  - [ ] Alerts button navigates to settings
  - [ ] Last Updated timestamp displays

- [ ] **Charts**
  - [ ] LineChart renders (Google Ads trends)
  - [ ] BarChart renders (Meta campaigns)
  - [ ] ConversionFunnel renders
  - [ ] Charts lazy load correctly
  - [ ] No rendering errors

- [ ] **Performance**
  - [ ] Dashboard loads in <2 seconds
  - [ ] SWR cache working (instant subsequent loads)
  - [ ] No layout shift issues
  - [ ] Smooth transitions

---

### ✅ 4. Alert System

- [ ] **Settings Page**
  - [ ] `/settings/alerts` loads
  - [ ] All thresholds display
  - [ ] Toggles work
  - [ ] Threshold values can be changed
  - [ ] Email recipients can be added/removed
  - [ ] Slack webhook can be configured
  - [ ] Save button works

- [ ] **Notifications** (if configured)
  - [ ] Email notifications send (test with Resend sandbox)
  - [ ] Slack notifications send (test webhook)
  - [ ] Messages are formatted correctly
  - [ ] Dashboard links work

- [ ] **Anomaly Detection**
  - [ ] Historical metrics stored
  - [ ] Anomalies detected correctly
  - [ ] Notifications triggered on anomalies

---

### ✅ 5. Build & TypeScript

- [ ] **Build Process**
  - [ ] `npm run build` completes successfully
  - [ ] No TypeScript errors
  - [ ] No ESLint errors
  - [ ] All routes generated

- [ ] **Type Safety**
  - [ ] All components properly typed
  - [ ] API responses match interfaces
  - [ ] No `any` types in critical paths

**Test Command:**
```bash
npm run build
# Should complete without errors
```

---

### ✅ 6. Environment Variables

- [ ] **Required Variables Set**
  - [ ] `CRON_SECRET` (generated)
  - [ ] `API_SECRET_KEY` (generated)
  - [ ] `NEXT_PUBLIC_BASE_URL` (will be updated for production)

- [ ] **Optional Variables** (if using features)
  - [ ] `GOOGLE_ADS_CLIENT_ID`
  - [ ] `GOOGLE_ADS_CLIENT_SECRET`
  - [ ] `GOOGLE_ADS_DEVELOPER_TOKEN`
  - [ ] `GOOGLE_ADS_CUSTOMER_ID`
  - [ ] `GOOGLE_ADS_REFRESH_TOKEN`
  - [ ] `META_ACCESS_TOKEN`
  - [ ] `META_AD_ACCOUNT_ID`
  - [ ] `RESEND_API_KEY` (for email notifications)

- [ ] **Security**
  - [ ] `.env.local` in `.gitignore`
  - [ ] No secrets committed to git
  - [ ] Secrets are strong (64+ characters)

**Verify:**
```bash
npx tsx scripts/test-all-apis.ts
# Check "Environment Variables" test passes
```

---

### ✅ 7. Documentation

- [ ] **User Documentation**
  - [ ] `README.md` is up to date
  - [ ] `DASHBOARD_SETUP.md` complete
  - [ ] Setup instructions clear

- [ ] **Technical Documentation**
  - [ ] `CRON_DOCUMENTATION.md` complete
  - [ ] `ALERTS_DOCUMENTATION.md` complete
  - [ ] `PERFORMANCE_OPTIMIZATION.md` complete
  - [ ] API endpoints documented

- [ ] **Deployment Documentation**
  - [ ] `DEPLOYMENT_CHECKLIST.md` reviewed
  - [ ] `FINAL_DEPLOYMENT_CHECKLIST.md` (this file) completed

---

## Deployment Process

### ✅ 1. Pre-Deployment

- [ ] All tests pass
- [ ] Build succeeds
- [ ] Git repository clean (no uncommitted changes)
- [ ] Latest changes pushed to main branch
- [ ] Version number updated (if applicable)

### ✅ 2. Vercel Deployment

- [ ] **Connect Repository**
  - [ ] Repository connected to Vercel
  - [ ] Branch: `main` (or production branch)
  - [ ] Framework preset: Next.js
  - [ ] Build command: `next build`
  - [ ] Output directory: `.next`

- [ ] **Environment Variables**
  - [ ] All variables from `.env.local` added to Vercel
  - [ ] Variables set for **Production** environment
  - [ ] Optionally set for **Preview** and **Development**
  - [ ] `NEXT_PUBLIC_BASE_URL` updated to production URL

- [ ] **Deploy**
  ```bash
  vercel deploy --prod
  ```

- [ ] **Verify Deployment**
  - [ ] Site loads at production URL
  - [ ] No build errors
  - [ ] No runtime errors

### ✅ 3. Post-Deployment Verification

- [ ] **Cron Job**
  - [ ] Vercel Dashboard → Crons tab shows cron job
  - [ ] Schedule matches: `1 0,6,12,18 * * *`
  - [ ] Click "Run Now" to test
  - [ ] Check function logs for success
  - [ ] Verify data updates on dashboard

- [ ] **Dashboard Functionality**
  - [ ] Homepage loads (<2 seconds)
  - [ ] Google Ads data displays
  - [ ] Meta Ads data displays
  - [ ] Charts render
  - [ ] Export PDF works
  - [ ] Force refresh works

- [ ] **API Endpoints**
  - [ ] `/api/metrics/cached` works
  - [ ] `/api/google-ads/metrics` works
  - [ ] `/api/meta-ads/metrics` works
  - [ ] `/api/settings/alerts` works
  - [ ] `/api/cron/refresh-metrics` works (with auth)

- [ ] **Performance**
  - [ ] Lighthouse score >90
  - [ ] Load time <2 seconds
  - [ ] No console errors
  - [ ] No layout shift

---

## Production Configuration

### ✅ 1. Domain & SSL

- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (Vercel auto)
- [ ] HTTPS enforced
- [ ] WWW redirect configured (if applicable)

### ✅ 2. Monitoring

- [ ] Vercel Analytics enabled (optional)
- [ ] Error tracking configured (Sentry, optional)
- [ ] Uptime monitoring (UptimeRobot, optional)

### ✅ 3. Notifications

- [ ] Email notifications tested
- [ ] Slack notifications tested
- [ ] Alert thresholds configured
- [ ] Recipients added

---

## Post-Deployment Tasks

### Immediate (Day 1)

- [ ] Monitor first cron execution
- [ ] Check for any errors in logs
- [ ] Verify data is updating every 6 hours
- [ ] Test all features in production
- [ ] Share dashboard URL with stakeholders

### Week 1

- [ ] Monitor daily for issues
- [ ] Check alert notifications
- [ ] Review cron job execution history
- [ ] Gather user feedback
- [ ] Document any issues

### Month 1

- [ ] Review performance metrics
- [ ] Check API usage and costs
- [ ] Rotate secrets (if policy requires)
- [ ] Update documentation based on learnings
- [ ] Plan future enhancements

---

## Rollback Plan

If issues occur in production:

### Option 1: Quick Fix

1. Identify issue in Vercel logs
2. Fix locally
3. Test fix
4. Deploy: `vercel deploy --prod`

### Option 2: Rollback

1. Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Verify rollback successful

### Option 3: Disable Cron

If cron is causing issues:

1. Vercel Dashboard → Crons
2. Disable cron job
3. Fix issue
4. Re-enable cron

---

## Success Criteria

✅ **Deployment is successful when:**

- [ ] Dashboard loads in production
- [ ] All metrics display correctly
- [ ] Charts render properly
- [ ] Cron job executes every 6 hours
- [ ] Data updates automatically
- [ ] No errors in logs
- [ ] Performance is acceptable (<2s load)
- [ ] Alerts work (if configured)
- [ ] PDF export works
- [ ] Force refresh works

---

## Final Sign-Off

**Deployed By:** ___________________________

**Date:** ___________________________

**Production URL:** ___________________________

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## Support Contacts

**Technical Issues:**
- Documentation: See `DASHBOARD_SETUP.md`
- GitHub Issues: [Your Repo]
- Email: [Your Email]

**API Issues:**
- Google Ads: [Google Support](https://support.google.com/google-ads)
- Meta Ads: [Meta Support](https://www.facebook.com/business/help)

**Hosting Issues:**
- Vercel: [Vercel Support](https://vercel.com/support)

---

**Last Updated:** 2025-11-25
**Version:** 1.0.0
**Status:** Ready for Production ✅

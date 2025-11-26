'use client';

import { Suspense } from 'react';
import MetricsCard from '@/components/MetricsCard';
import CampaignCard from '@/components/CampaignCard';
import DashboardHeader from '@/components/DashboardHeader';
import {
  DashboardSkeleton,
  MetricsCardSkeleton,
  CampaignCardSkeleton,
} from '@/components/SkeletonLoader';
import { LineChart, BarChart, ConversionFunnel } from '@/components/LazyCharts';
import { useDashboardData, useManualRefresh } from '@/hooks/useDashboardData';
import {
  generateTrendData,
  generateConversionFunnelData,
  generateCampaignComparisonData,
} from '@/lib/mockData';

// Helper function to calculate ROAS with color coding
function calculateROAS(revenue: number, adSpend: number) {
  if (adSpend === 0) return { value: 0, formatted: '0x', color: 'text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-900/20' };

  const roas = revenue / adSpend;

  if (roas >= 3) {
    return {
      value: roas,
      formatted: `${roas.toFixed(1)}x`,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      status: 'excellent' as const,
    };
  } else if (roas >= 1) {
    return {
      value: roas,
      formatted: `${roas.toFixed(1)}x`,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      status: 'good' as const,
    };
  } else {
    return {
      value: roas,
      formatted: `${roas.toFixed(1)}x`,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      status: 'poor' as const,
    };
  }
}

// Helper to generate weekly revenue data
function generateWeeklyRevenueData(revenue: number, adSpend: number) {
  const weeks = 4;
  return Array.from({ length: weeks }, (_, i) => ({
    name: `Week ${i + 1}`,
    revenue: revenue / weeks + (Math.random() * revenue * 0.2 - revenue * 0.1),
    adSpend: adSpend / weeks + (Math.random() * adSpend * 0.2 - adSpend * 0.1),
  }));
}

export default function DashboardOptimized() {
  const { data: cachedData, error, isLoading, refresh } = useDashboardData();
  const { handleManualRefresh } = useManualRefresh();

  // Mock data for charts
  const trendData = generateTrendData(14);
  const funnelData = generateConversionFunnelData();

  // Calculate ROAS from Stripe + Ad Spend
  const stripeRevenue = cachedData?.data.stripe?.totalRevenue || 0;
  const googleAdSpend = cachedData?.data.google?.spend || 0;
  const metaAdSpend = cachedData?.data.meta?.totals.spend || 0;
  const totalAdSpend = googleAdSpend + metaAdSpend;
  const profit = stripeRevenue - totalAdSpend;
  const roasData = calculateROAS(stripeRevenue, totalAdSpend);
  const weeklyData = generateWeeklyRevenueData(stripeRevenue, totalAdSpend);

  const handleManualRefreshWrapper = async () => {
    try {
      await handleManualRefresh();
      // Refresh SWR cache
      await refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to refresh. Please try again.'
      );
    }
  };

  // Show full skeleton on first load
  if (isLoading && !cachedData) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Last Update */}
        <DashboardHeader
          lastUpdate={cachedData?.timestamp || null}
          timeSinceUpdate={cachedData?.timeSinceUpdate || null}
          onManualRefresh={handleManualRefreshWrapper}
          googleData={cachedData?.data.google || null}
          metaData={cachedData?.data.meta || null}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
            <p className="font-medium">⚠️ Error loading metrics</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        )}

        {/* API Errors from cached data */}
        {cachedData?.errors &&
          Object.keys(cachedData.errors).length > 0 && (
            <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
              <p className="font-medium">⚠️ Partial Data Available</p>
              {cachedData.errors.google && (
                <p className="text-sm mt-1">
                  Google Ads: {cachedData.errors.google}
                </p>
              )}
              {cachedData.errors.meta && (
                <p className="text-sm mt-1">
                  Meta Ads: {cachedData.errors.meta}
                </p>
              )}
              {cachedData.errors.calendly && (
                <p className="text-sm mt-1">
                  Calendly: {cachedData.errors.calendly}
                </p>
              )}
              {cachedData.errors.stripe && (
                <p className="text-sm mt-1">
                  Stripe: {cachedData.errors.stripe}
                </p>
              )}
            </div>
          )}

        {/* Revenue & ROI Section - TOP PRIORITY */}
        <section className="mb-12">
          <div className={`rounded-xl p-8 ${roasData.bgColor} border-2 ${roasData.borderColor} transition-all duration-300`}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <svg
                className="w-10 h-10 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Revenue & ROI
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {cachedData?.data.stripe?.dateRange.start} - {cachedData?.data.stripe?.dateRange.end || new Date().toISOString().split('T')[0]}
            </p>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Revenue */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</h3>
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                  ${stripeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {cachedData?.data.stripe?.totalConversions || 0} conversions
                </p>
              </div>

              {/* Total Conversions */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Conversions</h3>
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {cachedData?.data.stripe?.totalConversions || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  AOV: ${cachedData?.data.stripe?.averageOrderValue.toFixed(2) || '0.00'}
                </p>
              </div>

              {/* ROAS - Color Coded */}
              <div className={`rounded-lg shadow-lg p-6 border-2 ${roasData.borderColor} bg-white dark:bg-zinc-900`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">ROAS</h3>
                  <svg
                    className={`w-6 h-6 ${roasData.color}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {roasData.status === 'excellent' ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    ) : roasData.status === 'good' ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      />
                    )}
                  </svg>
                </div>
                <p className={`text-4xl font-bold ${roasData.color} mb-1`}>
                  {roasData.formatted}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Return on Ad Spend
                </p>
              </div>

              {/* Profit */}
              <div className={`rounded-lg shadow-lg p-6 border-2 ${profit >= 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'} bg-white dark:bg-zinc-900`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit</h3>
                  <svg
                    className={`w-6 h-6 ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className={`text-4xl font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} mb-1`}>
                  ${Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Revenue - Ad Spend
                </p>
              </div>
            </div>

            {/* Revenue vs Ad Spend Chart */}
            <Suspense fallback={<div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>}>
              <BarChart
                title="Revenue vs Ad Spend (Last 4 Weeks)"
                data={weeklyData}
                bars={[
                  { dataKey: 'revenue', name: 'Revenue', color: '#10B981' },
                  { dataKey: 'adSpend', name: 'Ad Spend', color: '#EF4444' },
                ]}
                xAxisKey="name"
              />
            </Suspense>
          </div>
        </section>

        {/* Google Ads Section */}
        {cachedData?.data.google ? (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Google Ads Performance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricsCard
                title="Impressions"
                value={cachedData.data.google.impressions.toLocaleString()}
                subtitle={`${cachedData.data.google.dateRange.start} - ${cachedData.data.google.dateRange.end}`}
                trend="up"
                trendValue="+12%"
                loading={isLoading}
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                }
              />

              <MetricsCard
                title="Click-Through Rate"
                value={`${cachedData.data.google.ctr.toFixed(2)}%`}
                subtitle="CTR"
                trend={cachedData.data.google.ctr >= 2 ? 'up' : 'down'}
                trendValue={`${cachedData.data.google.ctr >= 2 ? '+' : ''}0.3%`}
                loading={isLoading}
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                    />
                  </svg>
                }
              />

              <MetricsCard
                title="Total Clicks"
                value={cachedData.data.google.clicks.toLocaleString()}
                subtitle="User engagement"
                trend="up"
                trendValue="+8%"
                loading={isLoading}
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                    />
                  </svg>
                }
              />

              <MetricsCard
                title="Ad Spend"
                value={`$${cachedData.data.google.spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle="Total investment"
                trend="neutral"
                loading={isLoading}
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
            </div>

            {/* Trend Chart - Lazy Loaded */}
            <Suspense fallback={<div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>}>
              <LineChart
                title="Clicks Over Time (Last 14 Days)"
                data={trendData}
                lines={[
                  { dataKey: 'clicks', name: 'Clicks', color: '#3B82F6' },
                ]}
                xAxisKey="date"
              />
            </Suspense>
          </section>
        ) : (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Google Ads Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricsCardSkeleton />
              <MetricsCardSkeleton />
              <MetricsCardSkeleton />
              <MetricsCardSkeleton />
            </div>
          </section>
        )}

        {/* Meta Ads Section */}
        {cachedData?.data.meta ? (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Meta Ads Performance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricsCard
                title="Total Reach"
                value={cachedData.data.meta.totals.reach.toLocaleString()}
                subtitle="Unique users"
                trend="up"
                trendValue="+15%"
                loading={isLoading}
              />

              <MetricsCard
                title="WhatsApp Conversations"
                value={cachedData.data.meta.totals.whatsappConversations.toLocaleString()}
                subtitle="Total conversations"
                trend="up"
                trendValue="+22%"
                loading={isLoading}
              />

              <MetricsCard
                title="Cost per Conversation"
                value={`$${cachedData.data.meta.totals.avgCostPerConversation.toFixed(2)}`}
                subtitle="Average CPC"
                trend="down"
                trendValue="-5%"
                loading={isLoading}
              />

              <MetricsCard
                title="Ad Spend"
                value={`$${cachedData.data.meta.totals.spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle="Total investment"
                trend="neutral"
                loading={isLoading}
              />
            </div>

            {/* Campaign Comparison Chart - Lazy Loaded */}
            {cachedData.data.meta.campaigns &&
              cachedData.data.meta.campaigns.length > 0 && (
                <div className="mb-8">
                  <Suspense fallback={<div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>}>
                    <BarChart
                      title="Campaign Performance Comparison"
                      data={generateCampaignComparisonData(
                        cachedData.data.meta.campaigns.map(c => c.campaignName)
                      )}
                      bars={[
                        { dataKey: 'conversions', name: 'Conversions', color: '#8B5CF6' },
                      ]}
                      xAxisKey="name"
                    />
                  </Suspense>
                </div>
              )}

            {/* Individual Campaigns */}
            {cachedData.data.meta.campaigns &&
              cachedData.data.meta.campaigns.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Active Campaigns
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cachedData.data.meta.campaigns.map((campaign) => (
                      <CampaignCard key={campaign.campaignId} campaign={campaign} />
                    ))}
                  </div>
                </div>
              )}
          </section>
        ) : (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Meta Ads Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <MetricsCardSkeleton />
              <MetricsCardSkeleton />
              <MetricsCardSkeleton />
              <MetricsCardSkeleton />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CampaignCardSkeleton />
              <CampaignCardSkeleton />
              <CampaignCardSkeleton />
            </div>
          </section>
        )}

        {/* Calendly Meeting Bookings Section */}
        {cachedData?.data.calendly ? (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Meeting Bookings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricsCard
                title="Total Bookings"
                value={cachedData.data.calendly.totalBooked.toLocaleString()}
                subtitle={`${cachedData.data.calendly.dateRange.start} - ${cachedData.data.calendly.dateRange.end}`}
                trend="up"
                trendValue="+18%"
                loading={isLoading}
                tooltip="Total number of meetings booked through Calendly"
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                }
              />

              <MetricsCard
                title="Completed Meetings"
                value={cachedData.data.calendly.completed.toLocaleString()}
                subtitle={`${cachedData.data.calendly.conversionRate.toFixed(1)}% conversion`}
                trend={cachedData.data.calendly.conversionRate >= 70 ? 'up' : 'down'}
                trendValue={`${cachedData.data.calendly.conversionRate.toFixed(1)}%`}
                loading={isLoading}
                tooltip="Meetings that were completed (not canceled or no-show)"
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />

              <MetricsCard
                title="No-Shows"
                value={cachedData.data.calendly.noShows.toLocaleString()}
                subtitle={`${((cachedData.data.calendly.noShows / cachedData.data.calendly.totalBooked) * 100).toFixed(1)}% no-show rate`}
                trend={cachedData.data.calendly.noShows === 0 ? 'up' : 'down'}
                trendValue={`${((cachedData.data.calendly.noShows / cachedData.data.calendly.totalBooked) * 100).toFixed(1)}%`}
                loading={isLoading}
                tooltip="Meetings where the invitee didn't show up"
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />

              {/* Lead to Meeting Conversion */}
              {cachedData?.data.meta && (
                <MetricsCard
                  title="Lead to Meeting Rate"
                  value={`${((cachedData.data.calendly.totalBooked / cachedData.data.meta.totals.whatsappConversations) * 100).toFixed(1)}%`}
                  subtitle="WhatsApp → Calendly"
                  trend={
                    (cachedData.data.calendly.totalBooked / cachedData.data.meta.totals.whatsappConversations) * 100 >= 20
                      ? 'up'
                      : 'neutral'
                  }
                  trendValue={`${cachedData.data.calendly.totalBooked} / ${cachedData.data.meta.totals.whatsappConversations}`}
                  loading={isLoading}
                  tooltip="Percentage of WhatsApp conversations that converted to scheduled meetings"
                  icon={
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  }
                />
              )}
            </div>

            {/* Bookings Trend Chart - Lazy Loaded */}
            <Suspense fallback={<div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>}>
              <LineChart
                title="Meeting Bookings Over Time"
                data={generateTrendData(14).map(d => ({
                  ...d,
                  bookings: Math.floor(Math.random() * 30) + 10,
                }))}
                lines={[
                  { dataKey: 'bookings', name: 'Meetings Booked', color: '#3B82F6' },
                ]}
                xAxisKey="date"
              />
            </Suspense>
          </section>
        ) : cachedData?.errors?.calendly ? (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Meeting Bookings
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 text-center">
              <svg
                className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Calendly Data Unavailable
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {cachedData.errors.calendly}
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                Showing cached data from last successful refresh
              </p>
            </div>
          </section>
        ) : null}

        {/* Conversion Funnel - Lazy Loaded */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Customer Journey
          </h2>
          <Suspense fallback={<div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>}>
            <ConversionFunnel stages={funnelData} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

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

export default function DashboardOptimized() {
  const { data: cachedData, error, isLoading, refresh } = useDashboardData();
  const { handleManualRefresh } = useManualRefresh();

  // Mock data for charts
  const trendData = generateTrendData(14);
  const funnelData = generateConversionFunnelData();

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
            </div>
          )}

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

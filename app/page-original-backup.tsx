'use client';

import { useEffect, useState } from 'react';
import MetricsCard from '@/components/MetricsCard';
import CampaignCard from '@/components/CampaignCard';
import LineChart from '@/components/LineChart';
import BarChart from '@/components/BarChart';
import ConversionFunnel from '@/components/ConversionFunnel';
import DashboardHeader from '@/components/DashboardHeader';
import { GoogleAdsMetrics } from '@/types/google-ads';
import { MetaAdsMetrics, MetaCampaignMetrics } from '@/types/meta-ads';
import {
  generateTrendData,
  generateConversionFunnelData,
  generateCampaignComparisonData,
} from '@/lib/mockData';

interface CachedData {
  google?: GoogleAdsMetrics;
  meta?: {
    campaigns: MetaCampaignMetrics[];
    totals: MetaAdsMetrics;
  };
  timestamp: string;
  timeSinceUpdate: string | null;
  errors?: {
    google?: string;
    meta?: string;
  };
}

export default function Dashboard() {
  const [cachedData, setCachedData] = useState<CachedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for charts
  const trendData = generateTrendData(14);
  const funnelData = generateConversionFunnelData();

  useEffect(() => {
    fetchCachedMetrics();
    // Check for updates every 2 minutes
    const interval = setInterval(fetchCachedMetrics, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchCachedMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/metrics/cached');
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to fetch metrics');
      } else {
        setCachedData({
          google: data.data.google,
          meta: data.data.meta,
          timestamp: data.timestamp,
          timeSinceUpdate: data.timeSinceUpdate,
          errors: data.errors,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      setError(null);

      // Get API key from environment or prompt user
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || prompt('Enter API key for manual refresh:');

      if (!apiKey) {
        alert('API key required for manual refresh');
        return;
      }

      const response = await fetch('/api/cron/refresh-metrics', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
        },
      });

      const data = await response.json();

      if (!data.success) {
        alert(`Refresh failed: ${data.error || 'Unknown error'}`);
        return;
      }

      alert('Data refreshed successfully! Reloading metrics...');

      // Wait a moment for the cache to be written
      setTimeout(() => {
        fetchCachedMetrics();
      }, 1000);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatCompactNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value);
  };

  if (loading && !cachedData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading metrics...</p>
        </div>
      </div>
    );
  }

  // Generate campaign comparison data
  const campaignComparisonData =
    cachedData?.meta?.campaigns ? generateCampaignComparisonData(cachedData.meta.campaigns) : [];

  const googleMetrics = cachedData?.google;
  const metaMetrics = cachedData?.meta;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Last Update */}
        <DashboardHeader
          lastUpdate={cachedData?.timestamp || null}
          timeSinceUpdate={cachedData?.timeSinceUpdate || null}
          onManualRefresh={handleManualRefresh}
          googleData={cachedData?.google || null}
          metaData={cachedData?.meta || null}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Error loading metrics
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Google Ads Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.05 2L2 12.05l1.41 1.42 8.64-8.64 8.64 8.64L22.1 12.05 12.05 2z" />
                  <path d="M2 13.46l1.41 1.42 8.64-8.64 8.64 8.64 1.41-1.42L12.05 3.41 2 13.46z" />
                </svg>
                Google Ads
              </h2>
              {googleMetrics?.dateRange && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {googleMetrics.dateRange.start} to {googleMetrics.dateRange.end}
                </p>
              )}
            </div>
          </div>

          {cachedData?.errors?.google && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                    Google Ads Warning
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {cachedData.errors.google}
                  </p>
                </div>
              </div>
            </div>
          )}

          {googleMetrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricsCard
                  title="Impressions"
                  value={formatNumber(googleMetrics.impressions)}
                  subtitle="Total ad impressions"
                  trend="up"
                  trendValue="+8.2%"
                  loading={loading}
                  icon={
                    <svg
                      className="w-5 h-5"
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
                  title="Clicks"
                  value={formatNumber(googleMetrics.clicks)}
                  subtitle="Total ad clicks"
                  trend="up"
                  trendValue="+12.5%"
                  loading={loading}
                  icon={
                    <svg
                      className="w-5 h-5"
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
                  title="CTR"
                  value={`${googleMetrics.ctr}%`}
                  subtitle="Click-through rate"
                  trend="up"
                  trendValue="+3.8%"
                  loading={loading}
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  }
                />
                <MetricsCard
                  title="Spend"
                  value={formatCurrency(googleMetrics.spend)}
                  subtitle="Total ad spend"
                  trend="up"
                  trendValue="+5.2%"
                  loading={loading}
                  icon={
                    <svg
                      className="w-5 h-5"
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

              <LineChart
                data={trendData}
                lines={[
                  { dataKey: 'clicks', name: 'Clicks', color: '#3b82f6', strokeWidth: 3 },
                  { dataKey: 'conversions', name: 'Conversions', color: '#10b981' },
                ]}
                xAxisKey="date"
                title="Performance Trends (Last 14 Days)"
                height={300}
                loading={loading}
              />
            </>
          )}
        </section>

        {/* Meta Ads Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.04 21.54c.96.28 1.96.46 3 .46 5.52 0 10-4.48 10-10S17.56 2 12.04 2 2 6.48 2 12c0 5.24 4.02 9.55 9.16 9.96l.88-4.42zM13.5 7c.83 0 1.5.67 1.5 1.5S14.33 10 13.5 10 12 9.33 12 8.5 12.67 7 13.5 7z" />
                </svg>
                Meta Ads
              </h2>
              {metaMetrics?.totals?.dateRange && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {metaMetrics.totals.dateRange.start} to {metaMetrics.totals.dateRange.end}
                </p>
              )}
            </div>
          </div>

          {cachedData?.errors?.meta && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                    Meta Ads Warning
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {cachedData.errors.meta}
                  </p>
                </div>
              </div>
            </div>
          )}

          {metaMetrics?.totals && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricsCard
                  title="Reach"
                  value={formatCompactNumber(metaMetrics.totals.reach)}
                  subtitle="Unique users reached"
                  trend="up"
                  trendValue="+15.3%"
                  loading={loading}
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  }
                />
                <MetricsCard
                  title="WhatsApp Conversations"
                  value={formatNumber(metaMetrics.totals.whatsappConversations)}
                  subtitle="Conversations started"
                  trend="up"
                  trendValue="+22.7%"
                  loading={loading}
                  icon={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  }
                />
                <MetricsCard
                  title="Cost per Conversation"
                  value={formatCurrency(metaMetrics.totals.avgCostPerConversation)}
                  subtitle="Average cost"
                  trend="down"
                  trendValue="-8.4%"
                  loading={loading}
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                      />
                    </svg>
                  }
                />
                <MetricsCard
                  title="Total Spend"
                  value={formatCurrency(metaMetrics.totals.spend)}
                  subtitle="Meta ad spend"
                  trend="up"
                  trendValue="+6.1%"
                  loading={loading}
                  icon={
                    <svg
                      className="w-5 h-5"
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

              {campaignComparisonData.length > 0 && (
                <div className="mb-8">
                  <BarChart
                    data={campaignComparisonData}
                    bars={[
                      { dataKey: 'conversations', name: 'Conversations', color: '#8b5cf6' },
                      { dataKey: 'spend', name: 'Spend ($)', color: '#3b82f6' },
                    ]}
                    xAxisKey="name"
                    title="Campaign Performance Comparison"
                    height={300}
                    loading={loading}
                    yAxisFormatter={(value) =>
                      typeof value === 'number' && value > 1000
                        ? formatCompactNumber(value)
                        : value.toString()
                    }
                  />
                </div>
              )}

              {metaMetrics.campaigns && metaMetrics.campaigns.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Campaign Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {metaMetrics.campaigns.map((campaign) => (
                      <CampaignCard key={campaign.campaignId} campaign={campaign} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Conversion Funnel Section */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Conversion Funnel
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Customer journey from impression to conversion
            </p>
          </div>

          <ConversionFunnel stages={funnelData} loading={loading} />
        </section>
      </div>
    </div>
  );
}

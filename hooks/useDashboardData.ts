/**
 * Custom hook for dashboard data fetching with SWR
 * Provides automatic revalidation, caching, and error handling
 */

import useSWR from 'swr';
import { GoogleAdsMetrics } from '@/types/google-ads';
import { MetaAdsMetrics, MetaCampaignMetrics } from '@/types/meta-ads';

interface CachedMetricsResponse {
  success: boolean;
  data: {
    google?: GoogleAdsMetrics;
    meta?: {
      campaigns: MetaCampaignMetrics[];
      totals: MetaAdsMetrics;
    };
  };
  timestamp: string;
  timeSinceUpdate: string | null;
  errors?: {
    google?: string;
    meta?: string;
  };
}

const fetcher = async (url: string): Promise<CachedMetricsResponse> => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error('Failed to fetch metrics');
  }

  return res.json();
};

export function useDashboardData() {
  const { data, error, isLoading, mutate } = useSWR<CachedMetricsResponse>(
    '/api/metrics/cached',
    fetcher,
    {
      // Revalidate every 2 minutes
      refreshInterval: 2 * 60 * 1000,

      // Revalidate on focus
      revalidateOnFocus: true,

      // Revalidate on reconnect
      revalidateOnReconnect: true,

      // Keep previous data while revalidating
      keepPreviousData: true,

      // Dedupe requests within 2 seconds
      dedupingInterval: 2000,

      // Error retry configuration
      errorRetryCount: 3,
      errorRetryInterval: 5000,

      // Success callback
      onSuccess: (data) => {
        console.log('[SWR] Data refreshed successfully');
      },

      // Error callback
      onError: (error) => {
        console.error('[SWR] Error fetching data:', error);
      },
    }
  );

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  };
}

/**
 * Hook for manual refresh with optimistic updates
 */
export function useManualRefresh() {
  const handleManualRefresh = async (): Promise<void> => {
    const apiKey = prompt('Enter API secret key for manual refresh:');

    if (!apiKey) {
      throw new Error('API key required');
    }

    const response = await fetch('/api/cron/refresh-metrics', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Refresh failed');
    }

    // Wait 1 second for cache to update
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return response.json();
  };

  return { handleManualRefresh };
}

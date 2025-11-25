import { GoogleAdsMetrics } from '@/types/google-ads';

interface CacheEntry {
  data: GoogleAdsMetrics;
  timestamp: number;
}

// Simple in-memory cache (in production, use Redis or similar)
const cache = new Map<string, CacheEntry>();

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

export function getCachedMetrics(key: string = 'google-ads-metrics'): GoogleAdsMetrics | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  const isExpired = Date.now() - entry.timestamp > CACHE_TTL;

  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

export function setCachedMetrics(data: GoogleAdsMetrics, key: string = 'google-ads-metrics'): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export function getCacheTimestamp(key: string = 'google-ads-metrics'): string | null {
  const entry = cache.get(key);
  return entry ? new Date(entry.timestamp).toISOString() : null;
}

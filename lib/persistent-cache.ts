import { GoogleAdsMetrics } from '@/types/google-ads';
import { MetaAdsMetrics, MetaCampaignMetrics } from '@/types/meta-ads';
import { CalendlyMetrics } from '@/types/calendly';
import { RevenueMetrics } from '@/types/stripe';
import fs from 'fs';
import path from 'path';

interface CachedMetrics {
  google?: GoogleAdsMetrics;
  meta?: {
    campaigns: MetaCampaignMetrics[];
    totals: MetaAdsMetrics;
  };
  calendly?: CalendlyMetrics;
  stripe?: RevenueMetrics;
  timestamp: string;
  success: boolean;
  errors?: {
    google?: string;
    meta?: string;
    calendly?: string;
    stripe?: string;
  };
}

const CACHE_FILE = path.join(process.cwd(), '.cache', 'metrics.json');

// Ensure cache directory exists
function ensureCacheDir() {
  const cacheDir = path.join(process.cwd(), '.cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
}

// Read cached metrics from file
export function readCachedMetrics(): CachedMetrics | null {
  try {
    ensureCacheDir();
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const data = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading cached metrics:', error);
    return null;
  }
}

// Write metrics to cache file
export function writeCachedMetrics(metrics: CachedMetrics): boolean {
  try {
    ensureCacheDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(metrics, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing cached metrics:', error);
    return false;
  }
}

// Get time since last update
export function getTimeSinceUpdate(): string | null {
  const cached = readCachedMetrics();
  if (!cached) return null;

  const lastUpdate = new Date(cached.timestamp);
  const now = new Date();
  const diffMs = now.getTime() - lastUpdate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

// Check if cache should be refreshed (older than 6 hours)
export function shouldRefresh(): boolean {
  const cached = readCachedMetrics();
  if (!cached) return true;

  const lastUpdate = new Date(cached.timestamp);
  const now = new Date();
  const diffHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

  return diffHours >= 6;
}

/**
 * Intelligent Cache Manager with TTL Support
 * Provides in-memory caching with automatic expiration
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number; // in milliseconds

  constructor(defaultTTL: number = 6 * 60 * 60 * 1000) {
    // 6 hours default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Set cache entry with optional custom TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  /**
   * Get cache entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache entry metadata
   */
  getMetadata(key: string): { age: number; ttl: number } | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;
    const ttl = entry.expiresAt - now;

    return { age, ttl };
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    oldestEntry: number | null;
  } {
    let oldestTimestamp: number | null = null;

    this.cache.forEach((entry) => {
      if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    });

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      oldestEntry: oldestTimestamp,
    };
  }
}

// Global cache instance
const cacheManager = new CacheManager();

// Auto-cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanup();
  }, 60 * 60 * 1000);
}

export default cacheManager;

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join('|');

  return `${prefix}:${sortedParams}`;
}

/**
 * Cache-first fetch with fallback
 */
export async function cachedFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = cacheManager.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache
  cacheManager.set(cacheKey, data, ttl);

  return data;
}

/**
 * Stale-while-revalidate pattern
 * Returns cached data immediately, then revalidates in background
 */
export async function staleWhileRevalidate<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<{
  data: T;
  isStale: boolean;
}> {
  const cached = cacheManager.get<T>(cacheKey);

  if (cached) {
    // Return cached data immediately
    // Revalidate in background
    fetchFn()
      .then((freshData) => {
        cacheManager.set(cacheKey, freshData, ttl);
      })
      .catch((error) => {
        console.error('[CACHE] Background revalidation failed:', error);
      });

    return { data: cached, isStale: true };
  }

  // No cache, fetch fresh
  const data = await fetchFn();
  cacheManager.set(cacheKey, data, ttl);

  return { data, isStale: false };
}

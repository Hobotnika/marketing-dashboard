/**
 * API Utilities for Performance Optimization
 * Includes timeout handling and fallback strategies
 */

/**
 * Fetch with timeout
 * Throws error if request takes longer than timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000 // 10 seconds default
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }

    throw error;
  }
}

/**
 * Fetch with fallback to cached data
 * If API fails or times out, returns cached data if available
 */
export async function fetchWithFallback<T>(
  fetchFn: () => Promise<T>,
  fallbackData: T | null,
  timeout: number = 10000
): Promise<{
  data: T;
  source: 'api' | 'cache' | 'fallback';
  error?: string;
}> {
  try {
    // Wrap fetch in Promise.race with timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    );

    const data = await Promise.race([fetchFn(), timeoutPromise]);

    return {
      data,
      source: 'api',
    };
  } catch (error) {
    console.error('[API] Fetch failed:', error);

    if (fallbackData) {
      return {
        data: fallbackData,
        source: 'cache',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }

    throw error;
  }
}

/**
 * Batch multiple API calls with individual timeout handling
 */
export async function batchFetch<T extends Record<string, any>>(
  fetchers: {
    [K in keyof T]: () => Promise<T[K]>;
  },
  timeout: number = 10000
): Promise<{
  data: Partial<T>;
  errors: Partial<Record<keyof T, string>>;
}> {
  const keys = Object.keys(fetchers) as Array<keyof T>;
  const data: Partial<T> = {};
  const errors: Partial<Record<keyof T, string>> = {};

  // Execute all fetchers in parallel
  const results = await Promise.allSettled(
    keys.map((key) => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      );

      return Promise.race([fetchers[key](), timeoutPromise]);
    })
  );

  // Process results
  results.forEach((result, index) => {
    const key = keys[index];

    if (result.status === 'fulfilled') {
      data[key] = result.value;
    } else {
      errors[key] =
        result.reason instanceof Error
          ? result.reason.message
          : 'Unknown error';
    }
  });

  return { data, errors };
}

/**
 * Retry failed requests with exponential backoff
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Monitor API performance
 */
export async function monitoredFetch<T>(
  name: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const start = Date.now();

  try {
    const result = await fetchFn();
    const duration = Date.now() - start;

    console.log(`[PERF] ${name}: ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[PERF] ${name} failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Check if API response is fresh (not from cache)
 */
export function isFreshResponse(response: Response): boolean {
  const cacheControl = response.headers.get('cache-control');
  const age = response.headers.get('age');

  if (cacheControl?.includes('no-cache') || cacheControl?.includes('no-store')) {
    return true;
  }

  if (age && parseInt(age) > 0) {
    return false;
  }

  return true;
}

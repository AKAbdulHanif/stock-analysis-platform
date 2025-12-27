/**
 * Cache Service
 * 
 * Provides caching functionality with Redis backend and graceful degradation
 */

import { getRedisClient } from "../_core/redis";

// Cache statistics
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
};

/**
 * Cache TTL strategies (in seconds)
 */
export const CacheTTL = {
  STOCK_QUOTE: 5 * 60, // 5 minutes
  STOCK_CHART_SHORT: 15 * 60, // 15 minutes (1D, 5D)
  STOCK_CHART_LONG: 60 * 60, // 1 hour (1M, 3M, 6M, 1Y)
  TECHNICAL_INDICATORS: 10 * 60, // 10 minutes
  NEWS: 5 * 60, // 5 minutes
  SENTIMENT: 10 * 60, // 10 minutes
  HISTORICAL_DATA: 60 * 60, // 1 hour
  SECTOR_DATA: 30 * 60, // 30 minutes
};

/**
 * Generate cache key with namespace
 */
export function generateCacheKey(namespace: string, ...parts: (string | number)[]): string {
  return `investment:${namespace}:${parts.join(":")}`;
}

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    if (!client) {
      cacheStats.misses++;
      return null;
    }

    const value = await client.get(key);
    if (value === null) {
      cacheStats.misses++;
      return null;
    }

    cacheStats.hits++;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`[Cache] Error getting key ${key}:`, error);
    cacheStats.errors++;
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function cacheSet(key: string, value: any, ttl: number): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) {
      return false;
    }

    const serialized = JSON.stringify(value);
    await client.setex(key, ttl, serialized);
    cacheStats.sets++;
    return true;
  } catch (error) {
    console.error(`[Cache] Error setting key ${key}:`, error);
    cacheStats.errors++;
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) {
      return false;
    }

    await client.del(key);
    cacheStats.deletes++;
    return true;
  } catch (error) {
    console.error(`[Cache] Error deleting key ${key}:`, error);
    cacheStats.errors++;
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<number> {
  try {
    const client = await getRedisClient();
    if (!client) {
      return 0;
    }

    const keys = await client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    const deleted = await client.del(...keys);
    cacheStats.deletes += deleted;
    return deleted;
  } catch (error) {
    console.error(`[Cache] Error deleting pattern ${pattern}:`, error);
    cacheStats.errors++;
    return 0;
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? (cacheStats.hits / total) * 100 : 0;

  return {
    ...cacheStats,
    hitRate: hitRate.toFixed(2) + "%",
    total,
  };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats() {
  cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };
}

/**
 * Cache-aside pattern helper
 * Attempts to get from cache, falls back to fetcher function, and caches the result
 */
export async function cacheAside<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch from source
  const value = await fetcher();

  // Cache the result (fire and forget)
  cacheSet(key, value, ttl).catch((error) => {
    console.error(`[Cache] Failed to cache key ${key}:`, error);
  });

  return value;
}

/**
 * Warm cache with popular stocks
 */
export async function warmCache(tickers: string[], fetcher: (ticker: string) => Promise<any>) {
  console.log(`[Cache] Warming cache for ${tickers.length} tickers...`);
  
  const promises = tickers.map(async (ticker) => {
    try {
      await fetcher(ticker);
    } catch (error) {
      console.error(`[Cache] Failed to warm cache for ${ticker}:`, error);
    }
  });

  await Promise.all(promises);
  console.log(`[Cache] Cache warming complete`);
}

/**
 * Invalidate cache for a specific ticker
 */
export async function invalidateTickerCache(ticker: string): Promise<number> {
  const pattern = generateCacheKey("*", ticker, "*");
  return await cacheDeletePattern(pattern);
}

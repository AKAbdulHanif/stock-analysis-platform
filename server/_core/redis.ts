/**
 * Redis Connection Configuration
 * 
 * Provides Redis client setup with connection pooling and health checks
 */

import Redis from "ioredis";

let redisClient: Redis | null = null;

/**
 * Redis connection configuration
 */
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0", 10),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true, // Don't connect immediately
};

/**
 * Get or create Redis client
 * Returns null if Redis is not available (graceful degradation)
 */
export async function getRedisClient(): Promise<Redis | null> {
  // If client already exists and is connected, return it
  if (redisClient && redisClient.status === "ready") {
    return redisClient;
  }

  // If Redis is disabled in environment, return null
  if (process.env.REDIS_ENABLED === "false") {
    console.log("[Redis] Redis is disabled via environment variable");
    return null;
  }

  try {
    // Create new client if it doesn't exist
    if (!redisClient) {
      redisClient = new Redis(redisConfig);

      // Set up event listeners
      redisClient.on("connect", () => {
        console.log("[Redis] Connected to Redis server");
      });

      redisClient.on("ready", () => {
        console.log("[Redis] Redis client is ready");
      });

      redisClient.on("error", (error) => {
        console.error("[Redis] Redis connection error:", error.message);
      });

      redisClient.on("close", () => {
        console.log("[Redis] Redis connection closed");
      });

      redisClient.on("reconnecting", () => {
        console.log("[Redis] Reconnecting to Redis...");
      });
    }

    // Connect to Redis
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error("[Redis] Failed to connect to Redis:", error);
    // Graceful degradation: return null if Redis is unavailable
    return null;
  }
}

/**
 * Check Redis connection health
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const pong = await client.ping();
    return pong === "PONG";
  } catch (error) {
    console.error("[Redis] Health check failed:", error);
    return false;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log("[Redis] Connection closed");
  }
}

/**
 * Flush all Redis data (use with caution!)
 */
export async function flushRedisCache(): Promise<void> {
  const client = await getRedisClient();
  if (client) {
    await client.flushdb();
    console.log("[Redis] Cache flushed");
  }
}

import { createClient } from "redis";

let redisClientPromise = null;
let didWarnAboutRedisUrl = false;

function getRedisUrl() {
  const rawUrl = process.env.REDIS_URL?.trim();

  if (!rawUrl) {
    if (!didWarnAboutRedisUrl) {
      console.warn("REDIS_URL is not set. Redis caching is disabled.");
      didWarnAboutRedisUrl = true;
    }
    return null;
  }

  if (!rawUrl.startsWith("redis://") && !rawUrl.startsWith("rediss://")) {
    if (!didWarnAboutRedisUrl) {
      console.warn(
        "REDIS_URL must start with redis:// or rediss://. Redis caching is disabled until it is fixed."
      );
      didWarnAboutRedisUrl = true;
    }
    return null;
  }

  return rawUrl;
}

export async function getRedis() {
  const url = getRedisUrl();
  if (!url) return null;

  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      const client = createClient({ url });
      client.on("error", (error) => {
        console.error("Redis client error:", error);
      });
      await client.connect();
      return client;
    })().catch((error) => {
      redisClientPromise = null;
      console.error("Failed to connect to Redis:", error);
      return null;
    });
  }

  return redisClientPromise;
}

export async function getJsonCache(cacheKey) {
  try {
    const redis = await getRedis();
    if (!redis) return null;

    const cached = await redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn(`Redis read failed for ${cacheKey}:`, error);
    return null;
  }
}

export async function setJsonCache(cacheKey, value, ttlSeconds) {
  try {
    const redis = await getRedis();
    if (!redis) return false;

    await redis.set(cacheKey, JSON.stringify(value), {
      EX: ttlSeconds,
    });
    return true;
  } catch (error) {
    console.warn(`Redis write failed for ${cacheKey}:`, error);
    return false;
  }
}

export async function deleteCacheKeys(cacheKeys) {
  try {
    const redis = await getRedis();
    if (!redis || !cacheKeys.length) return;

    await Promise.all(cacheKeys.map((cacheKey) => redis.del(cacheKey)));
  } catch (error) {
    console.warn("Redis cache invalidation failed:", error);
  }
}

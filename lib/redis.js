import { createClient } from "redis";
import logger from "./server/logging/logger.js";

const log = logger.child({ module: "redis" });
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const OP_TIMEOUT_MS = 1500;

const redisClient = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 2000,
    // keep retrying in the background, but never block requests on it
    reconnectStrategy: (retries) => Math.min(retries * 200, 5000),
  },
});

let lastErrorLoggedAt = 0;
redisClient.on("error", (err) => {
  // Redis being down must not flood the logs
  const now = Date.now();
  if (now - lastErrorLoggedAt > 30_000) {
    lastErrorLoggedAt = now;
    log.error("Redis error", { err });
  }
});

let connecting = null;
let unavailableUntil = 0; // circuit breaker: skip connection attempts for a while after a failure
const BACKOFF_MS = 15_000;

function withTimeout(promise, ms = OP_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Redis operation timed out")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function connectRedis() {
  if (redisClient.isReady) return true;
  if (Date.now() < unavailableUntil) return false; // Redis is down: do not slow every request
  try {
    if (!connecting) {
      connecting = redisClient
        .connect()
        .then(() => log.info("Redis connected"))
        .finally(() => {
          connecting = null;
        });
    }
    await withTimeout(connecting, 1200);
    return redisClient.isReady;
  } catch (error) {
    unavailableUntil = Date.now() + BACKOFF_MS;
    log.warn("Redis connection unavailable; running without cache for a while", { err: error });
    return false;
  }
}

/** Returns the client when it is usable, otherwise null (never throws / hangs). */
export async function getReadyRedisClient() {
  if (redisClient.isReady) return redisClient;
  return (await connectRedis()) ? redisClient : null;
}

export async function getJsonCache(key) {
  try {
    const client = await getReadyRedisClient();
    if (!client) return null;
    const data = await withTimeout(client.get(key));
    return data ? JSON.parse(data) : null;
  } catch (error) {
    log.warn("Redis GET failed", { key, err: error });
    return null;
  }
}

export async function setJsonCache(key, value, ttlSeconds = 600) {
  try {
    const client = await getReadyRedisClient();
    if (!client) return false;
    await withTimeout(client.setEx(key, ttlSeconds, JSON.stringify(value)));
    return true;
  } catch (error) {
    log.warn("Redis SET failed", { key, err: error });
    return false;
  }
}

export async function deleteCacheKeys(keys = []) {
  try {
    const list = keys.filter(Boolean);
    if (!list.length) return;
    const client = await getReadyRedisClient();
    if (!client) return;
    await withTimeout(client.del(list));
  } catch (error) {
    log.warn("Redis DELETE failed", { err: error });
  }
}

/** SET key NX EX ttl -> true when this caller won (used for webhook idempotency). */
export async function setIfAbsent(key, ttlSeconds = 86400) {
  try {
    const client = await getReadyRedisClient();
    if (!client) return true; // cannot dedupe without Redis; DB updates are idempotent anyway
    const res = await withTimeout(client.set(key, "1", { NX: true, EX: ttlSeconds }));
    return res === "OK";
  } catch (error) {
    log.warn("Redis SETNX failed", { err: error });
    return true;
  }
}

export default redisClient;

/**
 * Rate limiting.
 *
 * `RateLimiter` depends on the small `RateLimitStore` interface
 * (Dependency Inversion), so Redis, in-memory or test stores are
 * interchangeable (Liskov). The Redis store degrades to the in-memory store if
 * Redis is down so limits keep applying (per instance) instead of failing open.
 */
import { tooManyRequests } from "../errors/httpErrors.js";

/**
 * @typedef {{ hit(key: string, windowSeconds: number): Promise<{ count: number, ttl: number }> }} RateLimitStore
 */

/** @implements {RateLimitStore} */
export class MemoryRateLimitStore {
  constructor(now = () => Date.now()) {
    this.now = now;
    this.buckets = new Map();
  }

  async hit(key, windowSeconds) {
    const t = this.now();
    let b = this.buckets.get(key);
    if (!b || b.expires <= t) {
      b = { count: 0, expires: t + windowSeconds * 1000 };
      this.buckets.set(key, b);
    }
    b.count += 1;
    if (this.buckets.size > 10_000) this.sweep(t);
    return {
      count: b.count,
      ttl: Math.max(1, Math.ceil((b.expires - t) / 1000)),
    };
  }

  sweep(t = this.now()) {
    for (const [k, v] of this.buckets)
      if (v.expires <= t) this.buckets.delete(k);
  }

  reset() {
    this.buckets.clear();
  }
}

/** @implements {RateLimitStore} */
export class RedisRateLimitStore {
  /**
   * @param {{ getClient: () => Promise<any|null> }} redis  returns a ready client or null
   * @param {RateLimitStore} fallback
   */
  constructor(redis, fallback = new MemoryRateLimitStore()) {
    this.redis = redis;
    this.fallback = fallback;
  }

  async hit(key, windowSeconds) {
    try {
      const client = await this.redis.getClient();
      if (!client) return this.fallback.hit(key, windowSeconds);
      const redisKey = `rl:${key}`;
      const count = await client.incr(redisKey);
      if (count === 1) await client.expire(redisKey, windowSeconds);
      let ttl = await client.ttl(redisKey);
      if (ttl < 0) {
        await client.expire(redisKey, windowSeconds);
        ttl = windowSeconds;
      }
      return { count, ttl };
    } catch {
      return this.fallback.hit(key, windowSeconds);
    }
  }
}

export class RateLimiter {
  /** @param {RateLimitStore} store */
  constructor(store) {
    this.store = store;
  }

  /**
   * @param {{ name: string, key: string, limit: number, windowSeconds: number }} rule
   * @returns {Promise<{ allowed: boolean, remaining: number, retryAfter: number }>}
   */
  async check({ name, key, limit, windowSeconds }) {
    const { count, ttl } = await this.store.hit(
      `${name}:${key}`,
      windowSeconds,
    );
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfter: ttl,
    };
  }

  /** Throws a 429 HttpError when the rule is exceeded. */
  async enforce(rule) {
    const res = await this.check(rule);
    if (!res.allowed) throw tooManyRequests(res.retryAfter);
    return res;
  }
}

let limiter = null;

/** Lazily-built process-wide limiter (Redis if available, memory otherwise). */
export async function getRateLimiter() {
  if (limiter) return limiter;
  const { getReadyRedisClient } = await import("../../redis.js");
  limiter = new RateLimiter(
    new RedisRateLimitStore({ getClient: getReadyRedisClient }),
  );
  return limiter;
}

/** Test hook / DI hook. */
export function setRateLimiter(instance) {
  limiter = instance;
}

/** Ready-made rules so numbers live in one place. */
export const Limits = Object.freeze({
  login: { name: "login", limit: 5, windowSeconds: 15 * 60 },
  signup: { name: "signup", limit: 10, windowSeconds: 60 * 60 },
  forgotPassword: { name: "forgot", limit: 3, windowSeconds: 60 * 60 },
  resetPassword: { name: "reset", limit: 10, windowSeconds: 60 * 60 },
  payment: { name: "payment", limit: 30, windowSeconds: 10 * 60 },
  upload: { name: "upload", limit: 10, windowSeconds: 60 * 60 },
  mfa: { name: "mfa", limit: 5, windowSeconds: 10 * 60 },
  mutate: { name: "mutate", limit: 120, windowSeconds: 60 },
  read: { name: "read", limit: 300, windowSeconds: 60 },
  admin: { name: "admin", limit: 120, windowSeconds: 60 },
  mail: { name: "mail", limit: 20, windowSeconds: 60 * 60 },
});

import { vi } from "vitest";

export const ORIGIN = "http://localhost:3000";
export const UUID_A = "11111111-1111-4111-8111-111111111111";
export const UUID_B = "22222222-2222-4222-8222-222222222222";
export const UUID_C = "33333333-3333-4333-8333-333333333333";

/** Build a Request like the browser would send it (same-origin by default). */
export function makeRequest(path, { method = "GET", body, headers = {}, origin = ORIGIN, raw } = {}) {
  const h = { host: "localhost:3000", ...headers };
  if (origin) h.origin = origin;
  let payload;
  if (raw !== undefined) payload = raw;
  else if (body !== undefined) {
    payload = JSON.stringify(body);
    h["content-type"] ??= "application/json";
  }
  return new Request(`${ORIGIN}${path}`, { method, headers: h, body: method === "GET" ? undefined : payload });
}

export const ctx = (params = {}) => ({ params: Promise.resolve(params) });

export const sessions = {
  admin: (id = UUID_A) => ({ user: { id, username: "admin", isAdmin: true, isOwner: false } }),
  owner: (id = UUID_B) => ({ user: { id, username: "owner", isAdmin: false, isOwner: true } }),
  consumer: (id = UUID_C) => ({ user: { id, username: "consumer", isAdmin: false, isOwner: false } }),
};

/** Mocks for modules every route touches. Call at the top of a test file (vi.mock is hoisted separately). */
export const noRedis = () => ({
  getJsonCache: vi.fn().mockResolvedValue(null),
  setJsonCache: vi.fn().mockResolvedValue(true),
  deleteCacheKeys: vi.fn().mockResolvedValue(undefined),
  setIfAbsent: vi.fn().mockResolvedValue(true),
  getReadyRedisClient: vi.fn().mockResolvedValue(null),
  connectRedis: vi.fn().mockResolvedValue(false),
  default: {},
});

/**
 * Single source of truth for Redis cache keys.
 *
 * SECURITY: the tenant segment comes from server configuration ONLY.
 * Previously it was read from a client-controlled request header,
 * which let any caller read, poison or bypass cached entries.
 */
import { getEnv } from "../config/env.js";

const t = () => getEnv().TENANT_ID;
const k = (...parts) => `tenant:${t()}:${parts.join(":")}`;

export const cacheKeys = {
  messList: () => k("messes", "all"),
  messPending: () => k("messes", "pending"),
  mess: (id) => k("mess", id),
  messOrders: (id) => k("mess", id, "orders"),
  messAnalytics: (id) => k("mess", id, "analytics"),
  ownerProfile: (id) => k("owner", id, "profile"),
  ownerMesses: (id) => k("owner", id, "messes"),
  consumerProfile: (id) => k("consumer", id, "profile"),
  consumerHistory: (id) => k("consumer", id, "history"),
  consumerMonthly: (id) => k("consumer", id, "monthly-mess:v3"),
  consumersAll: () => k("consumers", "all"),
  adminUsers: () => k("admin", "users"),
  adminMesses: () => k("admin", "messes"),
  adminDashboard: () => k("admin", "dashboard"),
  adminProfile: (id) => k("admin", id, "profile"),
  notifications: (userId) => k("notifications", userId),
};

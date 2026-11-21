import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { consumerRepository } from "@/lib/server/repositories/accounts";
import { messRepository } from "@/lib/server/repositories/messes";

const TTL_SECONDS = 60 * 2;

export const GET = createRoute({ name: "admin.dashboard", auth: "admin" }, async () => {
  const key = cacheKeys.adminDashboard();
  const cached = await getJsonCache(key);
  if (cached !== null) return json(cached);

  const [totalUsers, totalMesses, pendingCount, recentSignups, pendingMesses] = await Promise.all([
    consumerRepository.count(),
    messRepository.countAll(),
    messRepository.countPending(),
    consumerRepository.listRecent(5),
    messRepository.recentPending(5),
  ]);

  const payload = {
    stats: { totalUsers, totalMesses, pendingCount },
    recentSignups: recentSignups.map((c) => ({ id: c.id, username: c.username, email: c.email })),
    pendingMesses,
  };
  await setJsonCache(key, payload, TTL_SECONDS);
  return json(payload);
});

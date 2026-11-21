import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { consumerRepository } from "@/lib/server/repositories/accounts";

export const dynamic = "force-dynamic";
const TTL_SECONDS = 60 * 2;

export const GET = createRoute({ name: "admin.users", auth: "admin" }, async () => {
  const key = cacheKeys.adminUsers();
  const cached = await getJsonCache(key);
  if (cached !== null) return json(cached);

  const users = await consumerRepository.listRecent(200);
  const payload = { success: true, users };
  await setJsonCache(key, payload, TTL_SECONDS);
  return json(payload);
});

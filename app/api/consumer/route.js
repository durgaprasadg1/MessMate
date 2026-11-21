import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { consumerRepository } from "@/lib/server/repositories/accounts";
import { toConsumerAdminDto } from "@/lib/server/repositories/dto";

const TTL_SECONDS = 60 * 2;

/** Admin-only list of consumers. Never contains password hashes or tokens. */
export const GET = createRoute({ name: "consumers.list", auth: "admin" }, async () => {
  const key = cacheKeys.consumersAll();
  const cached = await getJsonCache(key);
  if (cached !== null) return json(cached);
  const consumers = (await consumerRepository.listForAdmin()).map(toConsumerAdminDto);
  await setJsonCache(key, consumers, TTL_SECONDS);
  return json(consumers);
});

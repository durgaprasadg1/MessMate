import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { messRepository } from "@/lib/server/repositories/messes";
import { toMessListDto } from "@/lib/server/repositories/dto";

const TTL_SECONDS = 60 * 2;

// Public listing: only fields that are safe for anonymous visitors.
export const GET = createRoute({ name: "mess.list", auth: "public", cache: "public" }, async () => {
  const key = cacheKeys.messList();
  const cached = await getJsonCache(key);
  if (cached !== null) {
    const res = json(cached);
    res.headers.set("x-redis-cache", "HIT");
    return res;
  }
  const shaped = (await messRepository.listPublic()).map(toMessListDto);
  await setJsonCache(key, shaped, TTL_SECONDS);
  const res = json(shaped);
  res.headers.set("x-redis-cache", "MISS");
  return res;
});

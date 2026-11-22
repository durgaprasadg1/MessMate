import { getJsonCache, setJsonCache } from "../../redis.js";
import { cacheKeys } from "../cache/cacheKeys.js";
import { messRepository } from "../repositories/messes.js";
import { toMessPublicDto } from "../repositories/dto.js";
import { isUuid } from "../http/params.js";

const TTL_SECONDS = 60 * 2;

/**
 * Public mess detail (cached). Shared by GET /api/mess/[id] and the server-rendered
 * pages, so pages read the data directly instead of making an HTTP request to
 * their own server (one network hop less on every page view).
 *
 * @returns {Promise<{ mess: object|null, cacheHit: boolean }>}
 */
export async function getPublicMess(id) {
  if (!isUuid(id)) return { mess: null, cacheHit: false };

  const key = cacheKeys.mess(id);
  const cached = await getJsonCache(key);
  if (cached !== null) return { mess: cached, cacheHit: true };

  const row = await messRepository.getPublicDetail(id);
  if (!row) return { mess: null, cacheHit: false };

  const shaped = toMessPublicDto(row);
  shaped.alert = shaped.alerts?.map((m) => ({ ...m, _id: m.id })) ?? [];
  await setJsonCache(key, shaped, TTL_SECONDS);
  return { mess: shaped, cacheHit: false };
}

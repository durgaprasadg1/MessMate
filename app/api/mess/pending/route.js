import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { messRepository } from "@/lib/server/repositories/messes";
import { certificateViewUrl } from "@/lib/server/services/cloudinaryService";
import { toPendingMessDto } from "@/lib/server/repositories/dto";

// Contains certificates / Aadhaar hash: admin only.
export const GET = createRoute({ name: "mess.pending", auth: "admin" }, async () => {
  const key = cacheKeys.messPending();
  const cached = await getJsonCache(key);
  if (cached !== null) return json(cached);
  const shaped = (await messRepository.listPending()).map((m) => toPendingMessDto(m, certificateViewUrl));
  await setJsonCache(key, shaped, 120);
  return json(shaped);
});

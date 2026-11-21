import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { messRepository } from "@/lib/server/repositories/messes";
import { certificateViewUrl } from "@/lib/server/services/cloudinaryService";
import { toMessManagementDto } from "@/lib/server/repositories/dto";

/** Admin-only full mess list (the public /api/mess list never carries admin fields). */
export const GET = createRoute({ name: "admin.messes", auth: "admin" }, async () => {
  const key = cacheKeys.adminMesses();
  const cached = await getJsonCache(key);
  if (cached !== null) return json(cached);
  const shaped = (await messRepository.listForAdmin()).map((m) => toMessManagementDto(m, certificateViewUrl));
  await setJsonCache(key, shaped, 120);
  return json(shaped);
});

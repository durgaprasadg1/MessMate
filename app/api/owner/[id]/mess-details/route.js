import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { messRepository } from "@/lib/server/repositories/messes";
import { toMessManagementDto } from "@/lib/server/repositories/dto";
import { certificateViewUrl } from "@/lib/server/services/cloudinaryService";
import { requireSelf } from "@/lib/server/auth/guards";

export const GET = createRoute({ name: "owner.mess-details", auth: "owner", uuid: ["id"] }, async ({ params, session }) => {
  requireSelf(session, params.id);
  const key = cacheKeys.ownerMesses(params.id);
  const cached = await getJsonCache(key);
  if (cached !== null) return json({ messes: cached });

  const shaped = (await messRepository.listByOwner(params.id)).map((m) => toMessManagementDto(m, certificateViewUrl));
  await setJsonCache(key, shaped, 180);
  return json({ messes: shaped });
});

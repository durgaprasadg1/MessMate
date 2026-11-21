import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound } from "@/lib/server/errors/httpErrors";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { adminRepository } from "@/lib/server/repositories/accounts";
import { toAdminDto } from "@/lib/server/repositories/dto";
import { requireSelf } from "@/lib/server/auth/guards";

export const GET = createRoute(
  { name: "admin.profile", auth: "admin", uuid: ["id"] },
  async ({ params, session }) => {
    requireSelf(session, params.id);
    const key = cacheKeys.adminProfile(params.id);
    const cached = await getJsonCache(key);
    if (cached !== null) return json({ admin: cached, message: "Admin found" });

    const admin = toAdminDto(await adminRepository.findById(params.id));
    if (!admin) throw notFound("Admin not found");
    await setJsonCache(key, admin, 120);
    return json({ admin, message: "Admin found" });
  },
);

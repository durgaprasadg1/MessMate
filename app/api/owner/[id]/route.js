import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound } from "@/lib/server/errors/httpErrors";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import supabase from "@/lib/supabaseClient";
import { toOwnerDto } from "@/lib/server/repositories/dto";
import { requireSelf } from "@/lib/server/auth/guards";

export const GET = createRoute({ name: "owner.profile", auth: "session", uuid: ["id"] }, async ({ params, session }) => {
  requireSelf(session, params.id, { allowAdmin: true });
  const key = cacheKeys.ownerProfile(params.id);
  const cached = await getJsonCache(key);
  if (cached !== null) return json({ owner: cached, message: "owner found" });

  const { data, error } = await supabase
    .from("owner")
    .select("id, name, email, upi, phone_number, address, mess(id,name)")
    .eq("id", params.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound("owner not found");

  const owner = toOwnerDto(data);
  await setJsonCache(key, owner, 60 * 10);
  return json({ owner, message: "owner found" });
});

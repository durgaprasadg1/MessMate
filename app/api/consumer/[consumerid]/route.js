import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound } from "@/lib/server/errors/httpErrors";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { consumerRepository } from "@/lib/server/repositories/accounts";
import { toConsumerDto } from "@/lib/server/repositories/dto";
import { requireSelf } from "@/lib/server/auth/guards";

export const GET = createRoute({ name: "consumer.profile", auth: "session", uuid: ["consumerid"] }, async ({ params, session }) => {
  requireSelf(session, params.consumerid, { allowAdmin: true });
  const key = cacheKeys.consumerProfile(params.consumerid);
  const cached = await getJsonCache(key);
  if (cached !== null) return json({ consumer: cached, message: "Consumer found" });

  const consumer = toConsumerDto(await consumerRepository.findById(params.consumerid));
  if (!consumer) throw notFound("Consumer not found");
  await setJsonCache(key, consumer, 120);
  return json({ consumer, message: "Consumer found" });
});

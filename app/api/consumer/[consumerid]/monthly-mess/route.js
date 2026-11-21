import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound } from "@/lib/server/errors/httpErrors";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { registrationRepository } from "@/lib/server/repositories/registrations";
import { isMembershipPaymentComplete } from "@/lib/server/services/membership";
import { requireSelf } from "@/lib/server/auth/guards";

export const GET = createRoute({ name: "consumer.monthly-mess", auth: "consumer", uuid: ["consumerid"] }, async ({ params, session }) => {
  requireSelf(session, params.consumerid);
  const key = cacheKeys.consumerMonthly(params.consumerid);
  const cached = await getJsonCache(key);
  if (cached !== null) return json({ monthlyMess: cached });

  const paid = (await registrationRepository.listDetailedForConsumer(params.consumerid)).filter(isMembershipPaymentComplete);
  if (!paid.length) throw notFound("No Monthly Mess subscription found for this user.");

  await setJsonCache(key, paid, 120);
  return json({ monthlyMess: paid });
});

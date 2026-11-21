import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound } from "@/lib/server/errors/httpErrors";
import { consumerUpdateSchema } from "@/lib/server/validation/schemas";
import { consumerRepository } from "@/lib/server/repositories/accounts";
import { toConsumerDto } from "@/lib/server/repositories/dto";
import { requireSelf } from "@/lib/server/auth/guards";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";

export const PUT = createRoute(
  { name: "consumer.edit", auth: "consumer", uuid: ["consumerid"], body: consumerUpdateSchema },
  async ({ params, session, body }) => {
    requireSelf(session, params.consumerid);
    // Only these three fields are updatable; role/is_blocked/password cannot be mass-assigned.
    const updated = await consumerRepository.updateProfile(params.consumerid, body);
    if (!updated) throw notFound("Consumer not found");
    await deleteCacheKeys([cacheKeys.consumerProfile(updated.id), cacheKeys.consumersAll()]);
    return json({ message: "Updated successfully", updated: toConsumerDto(updated) });
  },
);

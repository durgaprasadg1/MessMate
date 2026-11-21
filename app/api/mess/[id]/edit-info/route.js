import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound } from "@/lib/server/errors/httpErrors";
import { messInfoUpdateSchema } from "@/lib/server/validation/schemas";
import { messRepository } from "@/lib/server/repositories/messes";
import { requireMessOwner } from "@/lib/server/auth/guards";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";

export const PUT = createRoute(
  { name: "mess.edit-info", auth: "owner", uuid: ["id"], body: messInfoUpdateSchema },
  async ({ params, session, body }) => {
    const mess = await requireMessOwner(session, params.id);
    const fields = {
      name: body.name,
      address: body.address,
      phone_number: body.phoneNumber,
      category: body.category,
      description: body.description,
    };
    if (body.limits !== undefined) fields.is_limited = body.limits;

    const updated = await messRepository.updateInfo(mess.id, fields);
    if (!updated) throw notFound("Mess not found");
    await deleteCacheKeys([cacheKeys.mess(mess.id), cacheKeys.messList(), cacheKeys.messPending(), cacheKeys.ownerMesses(mess.owner_id), cacheKeys.adminMesses()]);
    return json({ message: "Mess updated successfully", mess: { _id: updated.id } });
  },
);

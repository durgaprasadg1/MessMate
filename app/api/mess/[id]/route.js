import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound } from "@/lib/server/errors/httpErrors";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { messRepository } from "@/lib/server/repositories/messes";
import { getPublicMess } from "@/lib/server/services/messQueries";
import { requireMessOwner } from "@/lib/server/auth/guards";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

const invalidate = (id) =>
  deleteCacheKeys([
    cacheKeys.mess(id),
    cacheKeys.messList(),
    cacheKeys.adminMesses(),
  ]);

// Public detail page data (no e-mail / UPI / Aadhaar / certificate, reviewers expose only a display name).
export const GET = createRoute(
  { name: "mess.detail", auth: "public", cache: "public", uuid: ["id"] },
  async ({ params }) => {
    const { mess, cacheHit } = await getPublicMess(params.id);
    if (!mess) throw notFound("Mess not found");
    const res = json(mess);
    res.headers.set("x-redis-cache", cacheHit ? "HIT" : "MISS");
    return res;
  },
);

// Owner toggles open / closed.
export const PATCH = createRoute(
  { name: "mess.toggle-open", auth: "owner", uuid: ["id"], bodyType: "none" },
  async ({ params, session }) => {
    const mess = await requireMessOwner(session, params.id);
    const updated = await messRepository.setOpen(mess.id, !mess.is_open);
    await invalidate(mess.id);
    return json({
      message: updated.is_open ? "Mess Opened" : "Mess Closed",
      mess: updated,
    });
  },
);

// Owner (own mess) or admin may delete.
export const DELETE = createRoute(
  { name: "mess.delete", auth: "session", uuid: ["id"], bodyType: "none" },
  async ({ params, session, log }) => {
    const mess = await requireMessOwner(session, params.id, {
      allowAdmin: true,
    });
    const deleted = await messRepository.delete(mess.id);
    if (!deleted) throw notFound("Mess not found");
    await invalidate(mess.id);
    await deleteCacheKeys([
      cacheKeys.messPending(),
      cacheKeys.ownerMesses(mess.owner_id),
    ]);
    audit(
      AuditEvent.MESS_DELETED,
      { actorId: session.user.id, targetId: mess.id },
      log,
    );
    return json({ message: "Mess Deleted Successfully" });
  },
);

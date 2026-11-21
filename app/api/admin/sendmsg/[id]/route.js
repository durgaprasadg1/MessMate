import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound, forbidden } from "@/lib/server/errors/httpErrors";
import { adminMessageSchema } from "@/lib/server/validation/schemas";
import { messRepository, messageRepository } from "@/lib/server/repositories/messes";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

/** Admin sends a notice to a mess. */
export const POST = createRoute(
  { name: "admin.sendmsg", auth: "admin", uuid: ["id"], body: adminMessageSchema },
  async ({ params, body }) => {
    const mess = await messRepository.getOwnership(params.id);
    if (!mess) throw notFound("Mess not found");
    await messageRepository.create(mess.id, body.message);
    await deleteCacheKeys([cacheKeys.mess(mess.id)]);
    return json({ message: "Message received" });
  },
);

/** Admin blocks / unblocks a mess (kept on this URL for UI compatibility). */
export const PATCH = createRoute(
  { name: "admin.mess.block", auth: "admin", uuid: ["id"], bodyType: "none" },
  async ({ params, session, log }) => {
    const mess = await messRepository.getOwnership(params.id);
    if (!mess) throw notFound("Mess not found");
    const updated = await messRepository.setBlocked(mess.id, !mess.is_blocked);
    await deleteCacheKeys([cacheKeys.mess(mess.id), cacheKeys.messList(), cacheKeys.adminMesses()]);
    audit(AuditEvent.MESS_BLOCK_TOGGLED, { actorId: session.user.id, actorRole: "admin", targetId: mess.id, blocked: updated.is_blocked }, log);
    return json({ message: "Mess open/close updated", mess: updated });
  },
);

/**
 * Delete a notice. Here `[id]` is the MESSAGE id (that is how the UI calls it).
 * Allowed for admins and for the owner of the mess the notice was sent to.
 */
export const DELETE = createRoute(
  { name: "message.delete", auth: "session", uuid: ["id"], bodyType: "none" },
  async ({ params, session }) => {
    const msg = await messageRepository.getById(params.id);
    if (!msg) throw notFound("Message not found");
    if (!session.user.isAdmin) {
      const mess = await messRepository.getOwnership(msg.to_mess_id);
      if (!mess || mess.owner_id !== session.user.id) throw forbidden();
    }
    await messageRepository.delete(msg.id);
    await deleteCacheKeys([cacheKeys.mess(msg.to_mess_id)]);
    const remaining = await messageRepository.listForMess(msg.to_mess_id);
    return json({ message: "Message deleted", alert: remaining.map((m) => ({ ...m, _id: m.id })) });
  },
);

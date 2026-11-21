/**
 * Authorisation guards. Every protected handler goes through one of these;
 * nothing relies on the browser to decide who may do what.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions.js";
import { unauthorized, forbidden, notFound } from "../errors/httpErrors.js";
import { audit, AuditEvent } from "../logging/audit.js";
import { adminRepository, consumerRepository } from "../repositories/accounts.js";
import { messRepository } from "../repositories/messes.js";

export const roleOf = (session) =>
  session?.user?.isAdmin ? "admin" : session?.user?.isOwner ? "owner" : "consumer";

export async function getSession() {
  return getServerSession(authOptions);
}

function deny(session, why, extra = {}) {
  audit(AuditEvent.ACCESS_DENIED, { actorId: session?.user?.id, actorRole: session ? roleOf(session) : "anonymous", why, ...extra });
  return forbidden();
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user?.id) throw unauthorized();
  return session;
}

/** Admin role is re-verified against the database (deleted admins lose access at once). */
export async function requireAdmin() {
  const session = await requireSession();
  if (!session.user.isAdmin) throw deny(session, "admin_required");
  if (!(await adminRepository.findById(session.user.id, "id"))) throw deny(session, "admin_missing");
  return session;
}

export async function requireOwner() {
  const session = await requireSession();
  if (!session.user.isOwner) throw deny(session, "owner_required");
  return session;
}

export async function requireConsumer() {
  const session = await requireSession();
  if (session.user.isAdmin || session.user.isOwner) throw deny(session, "consumer_required");
  return session;
}

/** Consumer who is not blocked by an admin. Returns { session, consumer }. */
export async function requireActiveConsumer(session, message = "Your account is blocked by admin due to your activities.") {
  const consumer = await consumerRepository.findById(session.user.id, "id, username, email, is_blocked");
  if (!consumer) throw notFound("Consumer not found");
  if (consumer.is_blocked) throw forbidden(message);
  return consumer;
}

/** Caller must be `id` (or an admin when allowAdmin). */
export function requireSelf(session, id, { allowAdmin = false } = {}) {
  if (session.user.id === id) return;
  if (allowAdmin && session.user.isAdmin) return;
  throw deny(session, "not_self", { targetId: id });
}

/** Caller must own the mess (or be an admin when allowAdmin). Returns the mess row. */
export async function requireMessOwner(session, messId, { allowAdmin = false } = {}) {
  const mess = await messRepository.getOwnership(messId);
  if (!mess) throw notFound("Mess not found");
  if (allowAdmin && session.user.isAdmin) return mess;
  if (!mess.owner_id || mess.owner_id !== session.user.id) throw deny(session, "not_mess_owner", { targetId: messId });
  return mess;
}

/** Admin or owner (the roles that can enrol in MFA). */
export async function requireStaff() {
  const session = await requireSession();
  if (!session.user.isAdmin && !session.user.isOwner) throw deny(session, "staff_required");
  return session;
}

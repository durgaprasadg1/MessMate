/**
 * Audit trail for security-relevant events (who did what to which resource).
 * Written through the same logger but on a dedicated `channel: "audit"` so it
 * can be filtered / retained separately by your log platform.
 */
import logger from "./logger.js";

export const AuditEvent = Object.freeze({
  LOGIN_SUCCESS: "auth.login.success",
  LOGIN_FAILURE: "auth.login.failure",
  LOGIN_RATE_LIMITED: "auth.login.rate_limited",
  SIGNUP: "auth.signup",
  OWNER_SIGNUP: "auth.owner_signup",
  ADMIN_CREATED: "admin.created",
  PASSWORD_RESET_REQUESTED: "auth.password_reset.requested",
  PASSWORD_RESET_COMPLETED: "auth.password_reset.completed",
  PASSWORD_RESET_FAILED: "auth.password_reset.invalid_token",
  MFA_ENABLED: "auth.mfa.enabled",
  MFA_DISABLED: "auth.mfa.disabled",
  MFA_FAILED: "auth.mfa.failed",
  ACCESS_DENIED: "authz.denied",
  CSRF_BLOCKED: "security.csrf_blocked",
  RATE_LIMITED: "security.rate_limited",
  UPLOAD_REJECTED: "security.upload_rejected",
  USER_BLOCK_TOGGLED: "admin.user.block_toggled",
  MESS_BLOCK_TOGGLED: "admin.mess.block_toggled",
  MESS_VERIFIED: "admin.mess.verified",
  MESS_VERIFICATION_DENIED: "admin.mess.verification_denied",
  MESS_DELETED: "mess.deleted",
  MESS_CREATED: "mess.created",
  WARNING_SENT: "admin.warning_sent",
  REGISTRATION_CHANGED: "owner.registration.changed",
  ORDER_ACTION: "order.action",
  PAYMENT_VERIFIED: "payment.verified",
  PAYMENT_SIGNATURE_INVALID: "payment.signature_invalid",
  WEBHOOK_REJECTED: "payment.webhook.rejected",
  WEBHOOK_PROCESSED: "payment.webhook.processed",
});

/**
 * @param {string} event one of AuditEvent
 * @param {{ actorId?: string, actorRole?: string, targetId?: string, ip?: string, requestId?: string, [k: string]: any }} [fields]
 * @param {import("./logger.js").Logger} [log]
 */
export function audit(event, fields = {}, log = logger) {
  log.child({ channel: "audit" }).info(event, { event, ...fields });
}

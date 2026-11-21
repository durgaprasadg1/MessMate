import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { Limits } from "@/lib/server/security/rateLimiter";
import { mfaCodeSchema } from "@/lib/server/validation/schemas";
import * as mfa from "@/lib/server/services/mfaEnrollment";
import { requireStaff } from "@/lib/server/auth/guards";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

export const POST = createRoute(
  { name: "mfa.disable", auth: requireStaff, rateLimit: { ...Limits.mfa, by: "user" }, body: mfaCodeSchema },
  async ({ session, body, log }) => {
    await mfa.disable(session, body.code);
    audit(AuditEvent.MFA_DISABLED, { actorId: session.user.id }, log);
    return json({ message: "MFA disabled" });
  },
);

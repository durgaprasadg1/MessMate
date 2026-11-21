import QRCode from "qrcode";
import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { Limits } from "@/lib/server/security/rateLimiter";
import * as mfa from "@/lib/server/services/mfaEnrollment";
import { requireStaff } from "@/lib/server/auth/guards";

export const POST = createRoute(
  { name: "mfa.setup", auth: requireStaff, rateLimit: { ...Limits.mfa, by: "user" }, bodyType: "none" },
  async ({ session }) => {
    const { secret, otpauthUri } = await mfa.beginSetup(session);
    const qr = await QRCode.toDataURL(otpauthUri, { margin: 1, width: 220 });
    return json({ secret, otpauthUri, qr });
  },
);

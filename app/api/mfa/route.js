import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import * as mfa from "@/lib/server/services/mfaEnrollment";
import { requireStaff } from "@/lib/server/auth/guards";

export const GET = createRoute({ name: "mfa.status", auth: requireStaff }, async ({ session }) => json(await mfa.getStatus(session)));

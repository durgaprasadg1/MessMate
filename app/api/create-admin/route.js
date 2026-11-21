import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { conflict } from "@/lib/server/errors/httpErrors";
import { Limits } from "@/lib/server/security/rateLimiter";
import { adminCreateSchema } from "@/lib/server/validation/schemas";
import { getPasswordService } from "@/lib/server/auth/passwordService";
import { isEmailTaken } from "@/lib/server/services/accountService";
import supabase from "@/lib/supabaseClient";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

/**
 * Only an EXISTING admin can create another admin. The very first admin is
 * seeded with `npm run seed:admin` (scripts/seed-admin.mjs) - there is no
 * public endpoint or page that creates admins any more.
 */
export const POST = createRoute(
  { name: "admin.create", auth: "admin", rateLimit: { ...Limits.admin, by: "user" }, body: adminCreateSchema },
  async ({ body, session, log }) => {
    if (await isEmailTaken(body.email)) throw conflict("An account with this email already exists.");

    const { data, error } = await supabase
      .from("admin")
      .insert({
        name: body.name,
        email: body.email,
        phone_number: body.phoneNumber,
        address: body.address,
        password: await getPasswordService().hash(body.password),
      })
      .select("id, name")
      .single();
    if (error) throw error;
    audit(AuditEvent.ADMIN_CREATED, { actorId: session.user.id, targetId: data.id }, log);

    return json({ message: "Registration successful!", id: data.id, name: data.name }, 201);
  },
);

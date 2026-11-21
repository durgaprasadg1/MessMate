import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { conflict } from "@/lib/server/errors/httpErrors";
import { Limits } from "@/lib/server/security/rateLimiter";
import { ownerSignupSchema } from "@/lib/server/validation/schemas";
import { getPasswordService } from "@/lib/server/auth/passwordService";
import { isEmailTaken } from "@/lib/server/services/accountService";
import supabase from "@/lib/supabaseClient";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

export const POST = createRoute(
  { name: "auth.register-owner", auth: "public", rateLimit: Limits.signup, body: ownerSignupSchema },
  async ({ body, ip, log }) => {
    if (await isEmailTaken(body.email)) throw conflict("Email is already registered.");

    const { data: owner, error } = await supabase
      .from("owner")
      .insert({
        name: body.username,
        email: body.email,
        phone_number: body.phoneNumber,
        upi: body.upi,
        address: body.address,
        password: await getPasswordService().hash(body.password),
      })
      .select("id, name")
      .single();
    if (error) throw error;
    audit(AuditEvent.OWNER_SIGNUP, { actorId: owner.id, ip }, log);

    return json({ message: "Registration successful!", id: owner.id, username: owner.name }, 201);
  },
);

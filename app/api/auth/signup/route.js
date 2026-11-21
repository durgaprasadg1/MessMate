import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { conflict } from "@/lib/server/errors/httpErrors";
import { Limits } from "@/lib/server/security/rateLimiter";
import { consumerSignupSchema } from "@/lib/server/validation/schemas";
import { getPasswordService } from "@/lib/server/auth/passwordService";
import { isEmailTaken } from "@/lib/server/services/accountService";
import { consumerRepository } from "@/lib/server/repositories/accounts";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

export const POST = createRoute(
  { name: "auth.signup", auth: "public", rateLimit: Limits.signup, body: consumerSignupSchema },
  async ({ body, ip, log }) => {
    if (await isEmailTaken(body.email)) throw conflict("A user with this email already exists.");

    const created = await consumerRepository.create({
      username: body.username,
      email: body.email,
      phone: body.phoneNumber,
      address: body.address,
      passwordHash: await getPasswordService().hash(body.password),
    });
    audit(AuditEvent.SIGNUP, { actorId: created.id, ip }, log);

    return json({ message: " Registration successful!", id: created.id, username: created.username }, 201);
  },
);

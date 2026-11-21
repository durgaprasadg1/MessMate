import { z } from "zod";
import { validatePasswordStrength, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "../../passwordRules.js";

/**
 * Server-side password policy. The rules live in lib/passwordRules.js so the
 * UI and the API can never drift apart; ONLY this server check is trusted.
 */
export { validatePasswordStrength, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH };

export const passwordSchema = z.string().superRefine((value, ctx) => {
  const problems = validatePasswordStrength(value);
  if (problems.length) {
    ctx.addIssue({ code: "custom", message: `Password must contain ${problems.join(", ")}.` });
  }
});

import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { registrationRepository } from "@/lib/server/repositories/registrations";
import { isMembershipPaymentComplete, remainingDays } from "@/lib/server/services/membership";

// NOTE: the UI passes a mess id in this path segment; the data always belongs
// to the logged-in consumer, so the segment is intentionally not used.
export const GET = createRoute({ name: "consumer.check-registrations", auth: "consumer" }, async ({ session }) => {
  const registrations = await registrationRepository.listForConsumer(session.user.id);
  const active = registrations
    .filter(isMembershipPaymentComplete)
    .filter((reg) => remainingDays(reg, Number(reg.mess?.monthly_mess_duration || 30)) > 0);

  return json({
    registrations: active.map((reg) => ({
      duration: reg.duration,
      messName: reg.mess?.name,
      messCategory: reg.mess?.category,
      foodPreference: reg.food_preference,
    })),
  });
});

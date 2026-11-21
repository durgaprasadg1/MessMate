import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { badRequest } from "@/lib/server/errors/httpErrors";
import { verifyWebhookSignature } from "@/lib/server/services/paymentService";
import { orderRepository } from "@/lib/server/repositories/orders";
import { registrationRepository } from "@/lib/server/repositories/registrations";
import { setIfAbsent } from "@/lib/redis";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

export const runtime = "nodejs";

/**
 * Razorpay server-to-server events (payment.captured / payment.failed).
 *
 * - raw body + HMAC-SHA256 with RAZORPAY_WEBHOOK_SECRET, constant-time compare,
 *   fails closed when the secret is not configured
 * - idempotent: duplicate deliveries (same x-razorpay-event-id) are ignored and
 *   DB transitions only happen from a not-yet-paid state
 * - no CSRF / cookie auth: the signature is the authentication
 */
export const POST = createRoute(
  { name: "webhook.razorpay", auth: "public", csrf: false, bodyType: "raw", rateLimit: { name: "rzp-webhook", limit: 600, windowSeconds: 60, by: "ip" } },
  async ({ request, body: raw, ip, log }) => {
    const signature = request.headers.get("x-razorpay-signature") || "";
    if (!verifyWebhookSignature(raw, signature)) {
      audit(AuditEvent.WEBHOOK_REJECTED, { ip }, log);
      throw badRequest("bad signature");
    }

    const eventId = request.headers.get("x-razorpay-event-id");
    if (eventId && !(await setIfAbsent(`rzp:event:${eventId}`, 60 * 60 * 24 * 3))) {
      return json({ status: "duplicate" });
    }

    let event;
    try {
      event = JSON.parse(raw);
    } catch {
      throw badRequest("invalid payload");
    }

    const payment = event?.payload?.payment?.entity;
    const orderId = payment?.order_id;
    if (!orderId) return json({ status: "ignored" });

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const order = await orderRepository.findByRazorpayOrderId(orderId);
      if (order) await orderRepository.markPaidIfPending(order.id, { paymentId: payment.id });
      else {
        const reg = await registrationRepository.findByRazorpayOrderId(orderId);
        if (reg) await registrationRepository.markPaidIfPending(reg.id, { paymentId: payment.id });
      }
    } else if (event.event === "payment.failed") {
      const order = await orderRepository.findByRazorpayOrderId(orderId);
      if (order) await orderRepository.markFailed(order.id);
      else {
        const reg = await registrationRepository.findByRazorpayOrderId(orderId);
        if (reg) await registrationRepository.markFailed(reg.id);
      }
    }

    audit(AuditEvent.WEBHOOK_PROCESSED, { event: event.event, targetId: orderId }, log);
    return json({ status: "ok" });
  },
);

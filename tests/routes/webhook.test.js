import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import { makeRequest, ctx, noRedis } from "../helpers/http.js";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/redis", () => noRedis());
vi.mock("@/lib/supabaseClient", () => ({ default: { from: vi.fn() } }));
vi.mock("@/lib/server/repositories/orders", () => ({
  orderRepository: { findByRazorpayOrderId: vi.fn(), markPaidIfPending: vi.fn().mockResolvedValue(true), markFailed: vi.fn() },
}));
vi.mock("@/lib/server/repositories/registrations", () => ({
  registrationRepository: { findByRazorpayOrderId: vi.fn(), markPaidIfPending: vi.fn(), markFailed: vi.fn() },
}));

const { POST } = await import("@/app/api/webhooks/razorpay/route.js");
const { orderRepository } = await import("@/lib/server/repositories/orders");
const redis = await import("@/lib/redis");
const { setRateLimiter, RateLimiter, MemoryRateLimitStore } = await import("@/lib/server/security/rateLimiter.js");

const event = { event: "payment.captured", payload: { payment: { entity: { id: "pay_1", order_id: "order_1" } } } };
const raw = JSON.stringify(event);
const sign = (body, key = "rzp_webhook_secret") => crypto.createHmac("sha256", key).update(body).digest("hex");
// webhook calls come from Razorpay's servers: no Origin header
const call = (body, headers) => POST(makeRequest("/api/webhooks/razorpay", { method: "POST", raw: body, origin: null, headers: { "content-type": "application/json", ...headers } }), ctx());

beforeEach(() => {
  setRateLimiter(new RateLimiter(new MemoryRateLimitStore()));
  orderRepository.findByRazorpayOrderId.mockResolvedValue({ id: "db1" });
});

describe("POST /api/webhooks/razorpay", () => {
  it("rejects a missing or wrong signature", async () => {
    expect((await call(raw, {})).status).toBe(400);
    expect((await call(raw, { "x-razorpay-signature": sign(raw, "other") })).status).toBe(400);
    expect(orderRepository.markPaidIfPending).not.toHaveBeenCalled();
  });
  it("rejects a body that was modified after signing", async () => {
    expect((await call(raw.replace("pay_1", "pay_2"), { "x-razorpay-signature": sign(raw) })).status).toBe(400);
  });
  it("accepts a valid event and marks the order paid", async () => {
    const res = await call(raw, { "x-razorpay-signature": sign(raw), "x-razorpay-event-id": "evt_1" });
    expect(res.status).toBe(200);
    expect(orderRepository.markPaidIfPending).toHaveBeenCalledWith("db1", { paymentId: "pay_1" });
  });
  it("ignores duplicate deliveries (idempotent)", async () => {
    redis.setIfAbsent.mockResolvedValueOnce(false);
    const res = await call(raw, { "x-razorpay-signature": sign(raw), "x-razorpay-event-id": "evt_1" });
    expect((await res.json()).status).toBe("duplicate");
    expect(orderRepository.markPaidIfPending).not.toHaveBeenCalled();
  });
  it("marks failed payments", async () => {
    const failed = JSON.stringify({ ...event, event: "payment.failed" });
    await call(failed, { "x-razorpay-signature": sign(failed) });
    expect(orderRepository.markFailed).toHaveBeenCalledWith("db1");
  });
});

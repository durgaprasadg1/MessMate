import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyCheckoutSignature, verifyWebhookSignature } from "@/lib/server/services/paymentService.js";

const hmac = (k, m) => crypto.createHmac("sha256", k).update(m).digest("hex");

describe("Razorpay signatures", () => {
  it("accepts a valid checkout signature", () => {
    const sig = hmac("rzp_test_secret", "order_1|pay_1");
    expect(verifyCheckoutSignature({ orderId: "order_1", paymentId: "pay_1", signature: sig })).toBe(true);
  });
  it("rejects tampered / missing values", () => {
    const sig = hmac("rzp_test_secret", "order_1|pay_1");
    expect(verifyCheckoutSignature({ orderId: "order_2", paymentId: "pay_1", signature: sig })).toBe(false);
    expect(verifyCheckoutSignature({ orderId: "order_1", paymentId: "pay_1", signature: "" })).toBe(false);
    expect(verifyCheckoutSignature({ orderId: "order_1", paymentId: "pay_1", signature: "short" })).toBe(false);
  });
  it("webhook: valid, invalid and fail-closed without secret", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const sig = hmac("rzp_webhook_secret", body);
    expect(verifyWebhookSignature(body, sig)).toBe(true);
    expect(verifyWebhookSignature(body + " ", sig)).toBe(false);
    expect(verifyWebhookSignature(body, sig, "")).toBe(false);
  });
});

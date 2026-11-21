/**
 * Razorpay helpers behind a small interface (DIP): routes never touch the SDK
 * or the secret directly, and tests can inject a fake gateway.
 */
import crypto from "node:crypto";
import { safeEqual, hmacSha256Hex } from "../security/safeCompare.js";

function secret() {
  const s = process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEYSECRET;
  if (!s) throw new Error("RAZORPAY_SECRET is not configured");
  return s;
}

/** Checkout signature = HMAC_SHA256(order_id|payment_id). Constant-time compare, fails closed. */
export function verifyCheckoutSignature({ orderId, paymentId, signature }, key = secret()) {
  if (!orderId || !paymentId || !signature) return false;
  const expected = hmacSha256Hex(key, `${orderId}|${paymentId}`);
  return safeEqual(expected, signature);
}

/** Webhook signature = HMAC_SHA256(raw body) with the webhook secret. */
export function verifyWebhookSignature(rawBody, signature, key = process.env.RAZORPAY_WEBHOOK_SECRET) {
  if (!key || !signature) return false; // fail closed when not configured
  return safeEqual(hmacSha256Hex(key, rawBody), signature);
}

/** @implements {{ createOrder(args: {amount:number, receipt:string}): Promise<any> }} */
export class RazorpayGateway {
  async createOrder({ amount, receipt }) {
    const Razorpay = (await import("razorpay")).default;
    const client = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, key_secret: secret() });
    return client.orders.create({ amount, currency: "INR", receipt });
  }
}

let gateway = null;
export const getPaymentGateway = () => (gateway ??= new RazorpayGateway());
export const setPaymentGateway = (g) => {
  gateway = g;
};

export const newReceipt = (prefix) => `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

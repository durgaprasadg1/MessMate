import { describe, it, expect } from "vitest";
import { Logger, MemorySink } from "@/lib/server/logging/logger.js";
import { redact, REDACTED, maskEmail } from "@/lib/server/logging/redact.js";
import { audit, AuditEvent } from "@/lib/server/logging/audit.js";

describe("redact", () => {
  it("hides sensitive keys at any depth", () => {
    const out = redact({ user: { password: "p", token: "t", name: "ok" }, razorpay_signature: "s", upi: "a@b" });
    expect(out.user.password).toBe(REDACTED);
    expect(out.user.token).toBe(REDACTED);
    expect(out.user.name).toBe("ok");
    expect(out.razorpay_signature).toBe(REDACTED);
    expect(out.upi).toBe(REDACTED);
  });
  it("masks e-mail addresses in free text", () => {
    expect(maskEmail("mail jane.doe@example.com now")).toBe("mail j***@example.com now");
  });
  it("survives circular structures", () => {
    const a = {}; a.self = a;
    expect(() => redact(a)).not.toThrow();
  });
  it("serialises errors without stack traces", () => {
    const out = redact(new Error("boom"));
    expect(out).toMatchObject({ name: "Error", message: "boom" });
    expect(out.stack).toBeUndefined();
  });
});

describe("Logger", () => {
  it("respects levels and redacts", () => {
    const sink = new MemorySink();
    const log = new Logger({ level: "info", sink });
    log.debug("hidden");
    log.info("hello", { password: "x", email: "a.b@c.io" });
    expect(sink.entries).toHaveLength(1);
    expect(sink.entries[0]).toMatchObject({ level: "info", msg: "hello", password: REDACTED, email: "a***@c.io" });
  });
  it("child loggers carry bindings", () => {
    const sink = new MemorySink();
    new Logger({ level: "debug", sink }).child({ requestId: "r1" }).warn("w");
    expect(sink.entries[0].requestId).toBe("r1");
  });
  it("audit writes on the audit channel", () => {
    const sink = new MemorySink();
    audit(AuditEvent.LOGIN_FAILURE, { actorId: "u1" }, new Logger({ level: "info", sink }));
    expect(sink.entries[0]).toMatchObject({ channel: "audit", event: "auth.login.failure", actorId: "u1" });
  });
});

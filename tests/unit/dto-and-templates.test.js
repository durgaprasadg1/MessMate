import { describe, it, expect } from "vitest";
import { toConsumerDto, toOwnerDto, toAdminDto, toConsumerAdminDto, toMessPublicDto, toReviewDto, toMessListDto } from "@/lib/server/repositories/dto.js";
import * as t from "@/lib/server/mail/templates/index.js";
import { cacheKeys } from "@/lib/server/cache/cacheKeys.js";

const secretRow = { id: "1", username: "u", password: "HASH", reset_token: "TOK", mfa_secret: "S", email: "e@x.com" };

describe("DTOs never leak secrets", () => {
  it("consumer / owner / admin", () => {
    for (const dto of [toConsumerDto(secretRow), toOwnerDto({ ...secretRow, name: "n" }), toAdminDto({ ...secretRow, name: "n" }), toConsumerAdminDto(secretRow)]) {
      const s = JSON.stringify(dto);
      expect(s).not.toMatch(/HASH|TOK|"password"|reset_token|mfa/);
    }
  });
  it("review author exposes only id and username", () => {
    const r = toReviewDto({ id: "r", rating: 5, author: { id: "a", username: "bob", password: "HASH", email: "b@x.com" } });
    expect(Object.keys(r.author).sort()).toEqual(["_id", "id", "username"]);
  });
  it("public mess excludes e-mail, UPI, Aadhaar and certificate", () => {
    const dto = toMessPublicDto({ id: "m", name: "M", email: "o@x.com", upi: "a@upi", adhar_number: "123", certificate_url: "http://c", reviews: [] });
    expect(JSON.stringify(dto)).not.toMatch(/o@x\.com|a@upi|"123"|certificate|adhar/i);
  });
  it("mess list excludes private fields", () => {
    const dto = toMessListDto({ id: "m", name: "M", adhar_number: "1", email: "o@x.com", certificate_url: "c" });
    expect(JSON.stringify(dto)).not.toMatch(/adhar|email|certificate/i);
  });
});

describe("e-mail templates escape user input", () => {
  const evil = `<script>alert(1)</script>"><img src=x onerror=alert(1)>`;
  it.each([
    ["accountBlockedMail", () => t.accountBlockedMail({ name: evil })],
    ["warningMail", () => t.warningMail({ name: evil })],
    ["messVerifiedMail", () => t.messVerifiedMail({ ownerName: evil, messName: evil, dashboardLink: "https://x.y" })],
    ["messDeniedMail", () => t.messDeniedMail({ ownerName: evil })],
    ["registrationApprovedMail", () => t.registrationApprovedMail({ name: evil, messName: evil })],
    ["registrationExtendedMail", () => t.registrationExtendedMail({ name: evil, messName: evil, days: evil })],
    ["registrationRemovedMail", () => t.registrationRemovedMail({ name: evil, messName: evil })],
    ["monthlyRequestMail", () => t.monthlyRequestMail({ name: evil, messName: evil })],
    ["paymentSuccessMail", () => t.paymentSuccessMail({ name: evil, messName: evil, paymentId: evil, orderId: evil, amount: evil, duration: evil })],
    ["verificationReceivedMail", () => t.verificationReceivedMail({ ownerName: evil })],
    ["passwordResetMail", () => t.passwordResetMail({ name: evil, link: "javascript:alert(1)" })],
  ])("%s", (_n, build) => {
    const { html } = build();
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("javascript:");
  });
});

describe("cache keys", () => {
  it("are server-derived (no client controlled tenant)", () => {
    expect(cacheKeys.mess("abc")).toBe("tenant:public:mess:abc");
    expect(cacheKeys.consumerProfile("u")).toBe("tenant:public:consumer:u:profile");
  });
});

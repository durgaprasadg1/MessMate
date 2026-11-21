import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { makeRequest, ctx, noRedis, UUID_C } from "../helpers/http.js";
import { MemorySink, Logger } from "@/lib/server/logging/logger.js";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/redis", () => noRedis());
vi.mock("@/lib/supabaseClient", () => ({ default: { from: vi.fn() } }));
vi.mock("@/lib/server/mail/mailer", () => ({
  sendMailSafe: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/server/repositories/accounts", () => {
  const base = () => ({
    findById: vi.fn(),
    findByEmail: vi.fn(),
    emailExists: vi.fn().mockResolvedValue(false),
    findForLogin: vi.fn().mockResolvedValue(null),
    updatePassword: vi.fn().mockResolvedValue(),
    setRecoveryCodes: vi.fn(),
    nameColumn: "name",
  });
  return {
    adminRepository: base(),
    ownerRepository: base(),
    consumerRepository: {
      ...base(),
      nameColumn: "username",
      create: vi.fn(),
      setResetToken: vi.fn(),
      findByResetTokenHash: vi.fn(),
      resetPassword: vi.fn(),
    },
  };
});

const { authorizeCredentials, AUTH_ERRORS } =
  await import("@/lib/server/auth/authOptions.js");
const { adminRepository, ownerRepository, consumerRepository } =
  await import("@/lib/server/repositories/accounts");
const { setRateLimiter, RateLimiter, MemoryRateLimitStore } =
  await import("@/lib/server/security/rateLimiter.js");
const { setPasswordService, PasswordService } =
  await import("@/lib/server/auth/passwordService.js");
const { sendMailSafe } = await import("@/lib/server/mail/mailer");
const { encryptSecret, generateSecret, totpAt, generateRecoveryCodes } =
  await import("@/lib/server/auth/mfaService.js");
const { hashResetToken } =
  await import("@/lib/server/auth/resetTokenService.js");

const PW = "Correct-Horse-9-Battery";
let hash;
const req = { headers: { "x-forwarded-for": "203.0.113.5" } };

beforeEach(async () => {
  setRateLimiter(new RateLimiter(new MemoryRateLimitStore()));
  setPasswordService(new PasswordService({ cost: 10 }));
  hash ??= await bcrypt.hash(PW, 10);
  for (const r of [adminRepository, ownerRepository, consumerRepository])
    r.findForLogin.mockResolvedValue(null);
});

describe("login (authorize)", () => {
  it("returns identical errors for unknown e-mail and wrong password (no user enumeration)", async () => {
    await expect(
      authorizeCredentials({ email: "ghost@x.com", password: PW }, req),
    ).rejects.toThrow(AUTH_ERRORS.INVALID);
    consumerRepository.findForLogin.mockResolvedValue({
      id: UUID_C,
      username: "u",
      email: "u@x.com",
      password: hash,
    });
    await expect(
      authorizeCredentials(
        { email: "u@x.com", password: "wrong-password-1!" },
        req,
      ),
    ).rejects.toThrow(AUTH_ERRORS.INVALID);
  });
  it("logs a consumer in", async () => {
    consumerRepository.findForLogin.mockResolvedValue({
      id: UUID_C,
      username: "u",
      email: "u@x.com",
      password: hash,
    });
    expect(
      await authorizeCredentials({ email: "U@X.com", password: PW }, req),
    ).toMatchObject({ id: UUID_C, isAdmin: false, isOwner: false });
  });
  it("admin accounts are recognised first", async () => {
    adminRepository.findForLogin.mockResolvedValue({
      id: "a",
      name: "root",
      email: "a@x.com",
      password: hash,
    });
    expect(
      await authorizeCredentials({ email: "a@x.com", password: PW }, req),
    ).toMatchObject({ isAdmin: true });
  });
  it("locks out brute force after 5 attempts per IP+e-mail", async () => {
    consumerRepository.findForLogin.mockResolvedValue({
      id: UUID_C,
      username: "u",
      email: "u@x.com",
      password: hash,
    });
    for (let i = 0; i < 5; i++)
      await expect(
        authorizeCredentials(
          { email: "u@x.com", password: "bad-password-1!" },
          req,
        ),
      ).rejects.toThrow(AUTH_ERRORS.INVALID);
    await expect(
      authorizeCredentials({ email: "u@x.com", password: PW }, req),
    ).rejects.toThrow(AUTH_ERRORS.RATE_LIMITED);
  });
  it("rejects malformed credentials without touching the database", async () => {
    await expect(
      authorizeCredentials({ email: "not-an-email", password: "x" }, req),
    ).rejects.toThrow(AUTH_ERRORS.INVALID);
    await expect(authorizeCredentials(undefined, req)).rejects.toThrow(
      AUTH_ERRORS.INVALID,
    );
    expect(consumerRepository.findForLogin).not.toHaveBeenCalled();
  });
  it("upgrades old bcrypt hashes on successful login", async () => {
    setPasswordService(new PasswordService({ cost: 12 }));
    const old = await bcrypt.hash(PW, 8);
    ownerRepository.findForLogin.mockResolvedValue({
      id: "o",
      name: "o",
      email: "o@x.com",
      password: old,
    });
    await authorizeCredentials({ email: "o@x.com", password: PW }, req);
    await new Promise((r) => setTimeout(r, 400));
    expect(ownerRepository.updatePassword).toHaveBeenCalled();
  });

  describe("MFA", () => {
    const secret = generateSecret();
    const row = (extra = {}) => ({
      id: "o",
      name: "o",
      email: "o@x.com",
      password: undefined,
      mfa_enabled: true,
      mfa_secret: encryptSecret(secret),
      mfa_recovery_codes: [],
      ...extra,
    });
    beforeEach(() =>
      ownerRepository.findForLogin.mockResolvedValue(row({ password: hash })),
    );

    it("asks for a code when MFA is enabled", async () => {
      await expect(
        authorizeCredentials({ email: "o@x.com", password: PW }, req),
      ).rejects.toThrow(AUTH_ERRORS.MFA_REQUIRED);
    });
    it("rejects a wrong code, accepts the right one", async () => {
      await expect(
        authorizeCredentials(
          { email: "o@x.com", password: PW, mfaCode: "000000" },
          req,
        ),
      ).rejects.toThrow(AUTH_ERRORS.MFA_INVALID);
      const ok = await authorizeCredentials(
        { email: "o@x.com", password: PW, mfaCode: totpAt(secret) },
        req,
      );
      expect(ok).toMatchObject({ isOwner: true });
    });
    it("accepts a recovery code exactly once", async () => {
      const { codes, hashes } = generateRecoveryCodes(2);
      ownerRepository.findForLogin.mockResolvedValue(
        row({ password: hash, mfa_recovery_codes: hashes }),
      );
      await authorizeCredentials(
        { email: "o@x.com", password: PW, mfaCode: codes[0] },
        req,
      );
      expect(ownerRepository.setRecoveryCodes).toHaveBeenCalledWith("o", [
        hashes[1],
      ]);
    });
    it("a correct password alone never logs in", async () => {
      await expect(
        authorizeCredentials(
          { email: "o@x.com", password: PW, mfaCode: "" },
          req,
        ),
      ).rejects.toThrow();
    });
  });
});

describe("password reset", async () => {
  const { POST: forgot } =
    await import("@/app/api/auth/forgot-password/route.js");
  const reset = await import("@/app/api/auth/reset-password/[token]/route.js");

  it("answers identically whether or not the account exists", async () => {
    consumerRepository.findByEmail.mockResolvedValue(null);
    const a = await forgot(
      makeRequest("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "ghost@x.com" },
      }),
      ctx(),
    );
    consumerRepository.findByEmail.mockResolvedValue({
      id: UUID_C,
      email: "u@x.com",
      username: "u",
    });
    const b = await forgot(
      makeRequest("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "u@x.com" },
      }),
      ctx(),
    );
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(await a.json()).toEqual(await b.json());
  });
  it("stores only a hash of the token and mails a link built from NEXTAUTH_URL", async () => {
    consumerRepository.findByEmail.mockResolvedValue({
      id: UUID_C,
      email: "u@x.com",
      username: "u",
    });
    await forgot(
      makeRequest("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "u@x.com" },
        headers: { host: "evil.example", "x-forwarded-host": "evil.example" },
      }),
      ctx(),
    );
    const [, storedHash] = consumerRepository.setResetToken.mock.calls[0];
    const mail = sendMailSafe.mock.calls[0][0];
    const token = /reset-password\/([a-f0-9]{64})/.exec(mail.html)[1];
    expect(storedHash).toBe(hashResetToken(token));
    expect(storedHash).not.toBe(token);
    expect(mail.html).toContain("http://localhost:3000/reset-password/");
    expect(mail.html).not.toContain("evil.example");
    expect(mail.html).not.toContain("undefined");
  });
  it("rate limits forgot-password (mail bombing)", async () => {
    consumerRepository.findByEmail.mockResolvedValue(null);
    const call = () =>
      forgot(
        makeRequest("/api/auth/forgot-password", {
          method: "POST",
          body: { email: "u@x.com" },
        }),
        ctx(),
      );
    for (let i = 0; i < 3; i++) expect((await call()).status).toBe(200);
    expect((await call()).status).toBe(429);
  });
  it("token check works for logged-out visitors and rejects junk tokens", async () => {
    consumerRepository.findByResetTokenHash.mockResolvedValue({ id: UUID_C });
    const good = "a".repeat(64);
    expect(
      (await reset.GET(makeRequest("/x"), ctx({ token: good }))).status,
    ).toBe(200);
    expect(
      (await reset.GET(makeRequest("/x"), ctx({ token: "undefined" }))).status,
    ).toBe(400);
  });
  it("enforces the password policy on the server", async () => {
    consumerRepository.findByResetTokenHash.mockResolvedValue({ id: UUID_C });
    const res = await reset.PATCH(
      makeRequest("/x", { method: "PATCH", body: { password: "weak" } }),
      ctx({ token: "a".repeat(64) }),
    );
    expect(res.status).toBe(400);
    expect(consumerRepository.resetPassword).not.toHaveBeenCalled();
  });
  it("resets with a valid token and strong password", async () => {
    consumerRepository.findByResetTokenHash.mockResolvedValue({ id: UUID_C });
    const res = await reset.PATCH(
      makeRequest("/x", { method: "PATCH", body: { password: PW } }),
      ctx({ token: "a".repeat(64) }),
    );
    expect(res.status).toBe(200);
    expect(consumerRepository.resetPassword).toHaveBeenCalledWith(
      UUID_C,
      expect.stringMatching(/^\$2[aby]\$/),
    );
  });
});

describe("signup", async () => {
  const { POST } = await import("@/app/api/auth/signup/route.js");
  const body = {
    username: "Jane",
    email: "j@x.com",
    phoneNumber: "9876543210",
    address: "Pune, India",
    password: PW,
  };
  it("rejects weak passwords server-side", async () => {
    const res = await POST(
      makeRequest("/api/auth/signup", {
        method: "POST",
        body: { ...body, password: "Short1!" },
      }),
      ctx(),
    );
    expect(res.status).toBe(400);
  });
  it("blocks duplicate e-mails across admin/owner/consumer", async () => {
    ownerRepository.emailExists.mockResolvedValue(true);
    expect(
      (
        await POST(
          makeRequest("/api/auth/signup", { method: "POST", body }),
          ctx(),
        )
      ).status,
    ).toBe(409);
    ownerRepository.emailExists.mockResolvedValue(false);
  });
  it("stores a bcrypt hash, never the password, and ignores role-escalation fields", async () => {
    consumerRepository.create.mockResolvedValue({
      id: UUID_C,
      username: "Jane",
    });
    const res = await POST(
      makeRequest("/api/auth/signup", {
        method: "POST",
        body: { ...body, isAdmin: true, role: "admin" },
      }),
      ctx(),
    );
    expect(res.status).toBe(201);
    const arg = consumerRepository.create.mock.calls[0][0];
    expect(arg.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(JSON.stringify(arg)).not.toContain(PW);
    expect(arg).not.toHaveProperty("isAdmin");
  });
});

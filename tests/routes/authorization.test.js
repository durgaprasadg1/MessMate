/**
 * Authorization regression tests: they call the REAL route handlers with the
 * session and database layers mocked, and assert who can do what.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest, ctx, sessions, noRedis, UUID_A, UUID_B, UUID_C } from "../helpers/http.js";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/redis", () => noRedis());
vi.mock("@/lib/server/services/mfaEnrollment", () => ({ getStatus: vi.fn().mockResolvedValue({ enabled: false }) }));

vi.mock("@/lib/server/repositories/accounts", () => {
  const base = () => ({
    findById: vi.fn(), findByEmail: vi.fn(), emailExists: vi.fn().mockResolvedValue(false),
    findForLogin: vi.fn(), updatePassword: vi.fn(),
  });
  return {
    adminRepository: base(),
    ownerRepository: base(),
    consumerRepository: {
      ...base(), listForAdmin: vi.fn().mockResolvedValue([]), listRecent: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0),
      create: vi.fn(), updateProfile: vi.fn(), setBlocked: vi.fn(), markHasMonthlyMess: vi.fn(),
      setResetToken: vi.fn(), findByResetTokenHash: vi.fn(), resetPassword: vi.fn(),
    },
  };
});
vi.mock("@/lib/server/repositories/messes", () => ({
  messRepository: {
    getOwnership: vi.fn(), getForVerification: vi.fn(), setVerified: vi.fn(), delete: vi.fn(), listPending: vi.fn().mockResolvedValue([]),
    listForAdmin: vi.fn().mockResolvedValue([]), listPublic: vi.fn().mockResolvedValue([]), getPublicDetail: vi.fn(), setBlocked: vi.fn(),
    updateInfo: vi.fn(), setOpen: vi.fn(), idsByOwner: vi.fn().mockResolvedValue([]), getForBooking: vi.fn(), getWithOwner: vi.fn(),
    countAll: vi.fn(), countPending: vi.fn(), recentPending: vi.fn(), listByOwner: vi.fn().mockResolvedValue([]),
  },
  menuRepository: {}, messageRepository: { getById: vi.fn(), delete: vi.fn(), listForMess: vi.fn().mockResolvedValue([]), create: vi.fn() },
  reviewRepository: { getById: vi.fn(), delete: vi.fn(), create: vi.fn() },
}));
vi.mock("@/lib/server/repositories/registrations", () => ({
  registrationRepository: { listForMess: vi.fn().mockResolvedValue([]), findById: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
vi.mock("@/lib/server/repositories/orders", () => ({
  orderRepository: { listForMess: vi.fn().mockResolvedValue([]), idsClearableForMess: vi.fn().mockResolvedValue([]), findById: vi.fn(), update: vi.fn(), deleteOne: vi.fn() },
}));
vi.mock("@/lib/server/repositories/notifications", () => ({
  notificationRepository: { listFor: vi.fn().mockResolvedValue([]), unreadCount: vi.fn().mockResolvedValue(0), markRead: vi.fn(), markAllRead: vi.fn(), deleteAll: vi.fn() },
}));
vi.mock("@/lib/server/mail/mailer", () => ({ sendMailSafe: vi.fn().mockResolvedValue(true), getMailer: vi.fn(), setMailer: vi.fn() }));
vi.mock("@/lib/supabaseClient", () => ({ default: { from: vi.fn() } }));
vi.mock("@/lib/notifications", () => ({}));

const { getServerSession } = await import("next-auth");
const { adminRepository, consumerRepository } = await import("@/lib/server/repositories/accounts");
const { messRepository, messageRepository } = await import("@/lib/server/repositories/messes");
const { registrationRepository } = await import("@/lib/server/repositories/registrations");
const { setRateLimiter, RateLimiter, MemoryRateLimitStore } = await import("@/lib/server/security/rateLimiter");

const as = (s) => getServerSession.mockResolvedValue(s);
const status = async (p) => (await p).status;

beforeEach(() => {
  setRateLimiter(new RateLimiter(new MemoryRateLimitStore()));
  adminRepository.findById.mockResolvedValue({ id: UUID_A });
});

describe("POST /api/create-admin", async () => {
  const { POST } = await import("@/app/api/create-admin/route.js");
  const body = { name: "Root Admin", email: "a@b.com", phoneNumber: "9876543210", address: "Somewhere 1", password: "Correct-Horse-9-Battery" };
  const call = () => POST(makeRequest("/api/create-admin", { method: "POST", body }), ctx());

  it("is closed to anonymous callers", async () => {
    as(null);
    expect(await status(call())).toBe(401);
  });
  it("is closed to consumers and owners", async () => {
    as(sessions.consumer());
    expect(await status(call())).toBe(403);
    as(sessions.owner());
    expect(await status(call())).toBe(403);
  });
});

describe("admin-only endpoints reject everyone else", async () => {
  const cases = [
    ["GET /api/consumer", async () => (await import("@/app/api/consumer/route.js")).GET(makeRequest("/api/consumer"), ctx())],
    ["GET /api/admin", async () => (await import("@/app/api/admin/route.js")).GET(makeRequest("/api/admin"), ctx())],
    ["GET /api/mess/pending", async () => (await import("@/app/api/mess/pending/route.js")).GET(makeRequest("/api/mess/pending"), ctx())],
    ["POST make-verified", async () => (await import("@/app/api/mess/[id]/make-verified/route.js")).POST(makeRequest(`/api/mess/${UUID_B}/make-verified`, { method: "POST" }), ctx({ id: UUID_B }))],
    ["POST deny-verification", async () => (await import("@/app/api/mess/[id]/deny-verification/route.js")).POST(makeRequest(`/api/mess/${UUID_B}/deny-verification`, { method: "POST" }), ctx({ id: UUID_B }))],
    ["PATCH block user", async () => (await import("@/app/api/admin/blockings/users/[userid]/route.js")).PATCH(makeRequest(`/api/admin/blockings/users/${UUID_C}`, { method: "PATCH" }), ctx({ userid: UUID_C }))],
    ["POST warn-user", async () => (await import("@/app/api/admin/warn-user/[id]/route.js")).POST(makeRequest(`/api/admin/warn-user/${UUID_C}`, { method: "POST" }), ctx({ id: UUID_C }))],
    ["POST warn-owner", async () => (await import("@/app/api/admin/warn-mess-owner/[id]/route.js")).POST(makeRequest(`/api/admin/warn-mess-owner/${UUID_B}`, { method: "POST" }), ctx({ id: UUID_B }))],
    ["POST sendmsg", async () => (await import("@/app/api/admin/sendmsg/[id]/route.js")).POST(makeRequest(`/api/admin/sendmsg/${UUID_B}`, { method: "POST", body: { message: "x" } }), ctx({ id: UUID_B }))],
    ["PATCH mess block", async () => (await import("@/app/api/admin/sendmsg/[id]/route.js")).PATCH(makeRequest(`/api/admin/sendmsg/${UUID_B}`, { method: "PATCH" }), ctx({ id: UUID_B }))],
  ];
  it.each(cases)("%s", async (_name, run) => {
    as(null);
    expect((await run()).status).toBe(401);
    as(sessions.consumer());
    expect((await run()).status).toBe(403);
    as(sessions.owner());
    expect((await run()).status).toBe(403);
  });

  it("an admin session whose admin row was deleted loses access immediately", async () => {
    as(sessions.admin());
    adminRepository.findById.mockResolvedValue(null);
    const { GET } = await import("@/app/api/consumer/route.js");
    expect((await GET(makeRequest("/api/consumer"), ctx())).status).toBe(403);
  });

  it("admin list never contains password hashes", async () => {
    as(sessions.admin());
    consumerRepository.listForAdmin.mockResolvedValue([{ id: UUID_C, username: "u", email: "u@x.com", password: "HASH", reset_token: "T", is_blocked: false, reviews: [] }]);
    const { GET } = await import("@/app/api/consumer/route.js");
    const res = await GET(makeRequest("/api/consumer"), ctx());
    expect(res.status).toBe(200);
    expect(JSON.stringify(await res.json())).not.toMatch(/HASH|reset_token|password/);
  });
});

describe("profile endpoints are self-or-admin (BOLA)", async () => {
  const { GET: consumerGET } = await import("@/app/api/consumer/[consumerid]/route.js");
  const { GET: ownerGET } = await import("@/app/api/owner/[id]/route.js");
  const { GET: adminGET } = await import("@/app/api/admin/[id]/route.js");

  it("anonymous -> 401 on all three", async () => {
    as(null);
    expect((await consumerGET(makeRequest("/x"), ctx({ consumerid: UUID_C }))).status).toBe(401);
    expect((await ownerGET(makeRequest("/x"), ctx({ id: UUID_B }))).status).toBe(401);
    expect((await adminGET(makeRequest("/x"), ctx({ id: UUID_A }))).status).toBe(401);
  });
  it("another user's id -> 403", async () => {
    as(sessions.consumer(UUID_C));
    expect((await consumerGET(makeRequest("/x"), ctx({ consumerid: UUID_B }))).status).toBe(403);
    as(sessions.owner(UUID_B));
    expect((await ownerGET(makeRequest("/x"), ctx({ id: UUID_C }))).status).toBe(403);
  });
  it("own id works and omits secrets", async () => {
    as(sessions.consumer(UUID_C));
    consumerRepository.findById.mockResolvedValue({ id: UUID_C, username: "u", email: "e", password: "HASH" });
    const res = await consumerGET(makeRequest("/x"), ctx({ consumerid: UUID_C }));
    expect(res.status).toBe(200);
    expect(JSON.stringify(await res.json())).not.toContain("HASH");
  });
  it("malformed ids are rejected before touching the database", async () => {
    as(sessions.consumer());
    expect((await consumerGET(makeRequest("/x"), ctx({ consumerid: "1' OR '1'='1" }))).status).toBe(400);
    expect(consumerRepository.findById).not.toHaveBeenCalled();
  });
});

describe("mess management requires ownership", async () => {
  const { PUT } = await import("@/app/api/mess/[id]/edit-info/route.js");
  const { DELETE } = await import("@/app/api/mess/[id]/route.js");
  const body = { name: "My Mess", phoneNumber: "9876543210", category: "Veg" };
  const put = () => PUT(makeRequest(`/api/mess/${UUID_A}/edit-info`, { method: "PUT", body }), ctx({ id: UUID_A }));
  const del = () => DELETE(makeRequest(`/api/mess/${UUID_A}`, { method: "DELETE" }), ctx({ id: UUID_A }));

  it("anonymous cannot edit or delete", async () => {
    as(null);
    expect((await put()).status).toBe(401);
    expect((await del()).status).toBe(401);
  });
  it("an owner of a DIFFERENT mess cannot edit or delete it", async () => {
    as(sessions.owner(UUID_B));
    messRepository.getOwnership.mockResolvedValue({ id: UUID_A, owner_id: UUID_C });
    expect((await put()).status).toBe(403);
    expect((await del()).status).toBe(403);
    expect(messRepository.updateInfo).not.toHaveBeenCalled();
    expect(messRepository.delete).not.toHaveBeenCalled();
  });
  it("the owner can edit", async () => {
    as(sessions.owner(UUID_B));
    messRepository.getOwnership.mockResolvedValue({ id: UUID_A, owner_id: UUID_B });
    messRepository.updateInfo.mockResolvedValue({ id: UUID_A, owner_id: UUID_B });
    expect((await put()).status).toBe(200);
  });
  it("an admin can delete any mess", async () => {
    as(sessions.admin());
    messRepository.getOwnership.mockResolvedValue({ id: UUID_A, owner_id: UUID_B });
    messRepository.delete.mockResolvedValue({ id: UUID_A });
    expect((await del()).status).toBe(200);
  });
  it("rejects invalid input with 400 and no leak of internals", async () => {
    as(sessions.owner(UUID_B));
    messRepository.getOwnership.mockResolvedValue({ id: UUID_A, owner_id: UUID_B });
    const res = await PUT(makeRequest(`/api/mess/${UUID_A}/edit-info`, { method: "PUT", body: { name: "", phoneNumber: "1" } }), ctx({ id: UUID_A }));
    expect(res.status).toBe(400);
  });
});

describe("registrations (new-reg-customers) belong to the caller's mess", async () => {
  const { GET, PATCH, DELETE } = await import("@/app/api/owner/[id]/new-reg-customers/route.js");
  const url = `/api/owner/${UUID_A}/new-reg-customers`;

  it("anonymous / consumer / foreign owner are blocked", async () => {
    as(null);
    expect((await GET(makeRequest(url), ctx({ id: UUID_A }))).status).toBe(401);
    as(sessions.consumer());
    expect((await GET(makeRequest(url), ctx({ id: UUID_A }))).status).toBe(403);
    as(sessions.owner(UUID_B));
    messRepository.getOwnership.mockResolvedValue({ id: UUID_A, owner_id: UUID_C });
    expect((await GET(makeRequest(url), ctx({ id: UUID_A }))).status).toBe(403);
    expect((await PATCH(makeRequest(url, { method: "PATCH", body: { userId: UUID_C, allow: true } }), ctx({ id: UUID_A }))).status).toBe(403);
    expect((await DELETE(makeRequest(url, { method: "DELETE", body: { userId: UUID_C } }), ctx({ id: UUID_A }))).status).toBe(403);
  });
  it("an owner cannot touch a registration of ANOTHER mess (cross-mess IDOR)", async () => {
    as(sessions.owner(UUID_B));
    messRepository.getOwnership.mockResolvedValue({ id: UUID_A, owner_id: UUID_B, name: "M" });
    registrationRepository.findById.mockResolvedValue({ id: UUID_C, mess_id: "99999999-9999-4999-8999-999999999999", consumer_id: UUID_C });
    expect((await DELETE(makeRequest(url, { method: "DELETE", body: { userId: UUID_C } }), ctx({ id: UUID_A }))).status).toBe(404);
    expect(registrationRepository.delete).not.toHaveBeenCalled();
  });
});

describe("notifications are scoped to the caller", async () => {
  const { PATCH } = await import("@/app/api/notifications/[id]/route.js");
  it("marking someone else's notification finds nothing (404)", async () => {
    as(sessions.consumer());
    const { notificationRepository } = await import("@/lib/server/repositories/notifications");
    notificationRepository.markRead.mockResolvedValue(null);
    expect((await PATCH(makeRequest(`/api/notifications/${UUID_A}`, { method: "PATCH" }), ctx({ id: UUID_A }))).status).toBe(404);
    expect(notificationRepository.markRead).toHaveBeenCalledWith(UUID_A, UUID_C);
  });
});

describe("message deletion", async () => {
  const { DELETE } = await import("@/app/api/admin/sendmsg/[id]/route.js");
  it("a stranger cannot delete an admin notice", async () => {
    as(sessions.owner(UUID_B));
    messageRepository.getById.mockResolvedValue({ id: UUID_A, to_mess_id: UUID_C });
    messRepository.getOwnership.mockResolvedValue({ id: UUID_C, owner_id: UUID_A });
    expect((await DELETE(makeRequest(`/api/admin/sendmsg/${UUID_A}`, { method: "DELETE" }), ctx({ id: UUID_A }))).status).toBe(403);
  });
});

describe("MFA endpoints are staff-only", async () => {
  const { GET } = await import("@/app/api/mfa/route.js");
  it("consumers get 403", async () => {
    as(sessions.consumer());
    expect((await GET(makeRequest("/api/mfa"), ctx())).status).toBe(403);
  });
  it("owners are allowed", async () => {
    as(sessions.owner());
    expect((await GET(makeRequest("/api/mfa"), ctx())).status).toBe(200);
  });
});

import { describe, it, expect, vi } from "vitest";

vi.mock("next-auth/jwt", () => ({ getToken: vi.fn() }));
vi.mock("@/lib/supabaseClient", () => ({ default: { from: vi.fn() } }));

const { getToken } = await import("next-auth/jwt");
const { isAllowedSocketOrigin, authenticateSocket } = await import("@/lib/socket.js");

const prodEnv = { isProduction: true, baseUrl: "https://mess.example.com" };

describe("socket origin check", () => {
  it("allows the configured origin and the request host", () => {
    expect(isAllowedSocketOrigin({ origin: "https://mess.example.com", host: "mess.example.com" }, prodEnv)).toBe(true);
  });
  it("rejects foreign origins and missing origin in production", () => {
    expect(isAllowedSocketOrigin({ origin: "https://evil.example", host: "mess.example.com" }, prodEnv)).toBe(false);
    expect(isAllowedSocketOrigin({ host: "mess.example.com" }, prodEnv)).toBe(false);
  });
  it("allows localhost only outside production", () => {
    expect(isAllowedSocketOrigin({ origin: "http://localhost:3000", host: "x" }, { isProduction: false, baseUrl: "" })).toBe(true);
    expect(isAllowedSocketOrigin({ origin: "http://localhost:3000", host: "x" }, prodEnv)).toBe(false);
  });
});

describe("socket authentication", () => {
  const socket = (cookie) => ({ handshake: { headers: { cookie } } });
  it("rejects connections without a valid session token", async () => {
    getToken.mockResolvedValue(null);
    await expect(authenticateSocket(socket(""))).rejects.toThrow("unauthorized");
  });
  it("derives the identity from the session, not from client input", async () => {
    getToken.mockResolvedValue({ id: "u1", isOwner: false });
    const token = await authenticateSocket(socket("next-auth.session-token=abc"));
    expect(token.id).toBe("u1");
    expect(getToken.mock.calls[0][0].req.cookies["next-auth.session-token"]).toBe("abc");
  });
});

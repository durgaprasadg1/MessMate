// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";

const router = { replace: vi.fn(), push: vi.fn(), refresh: vi.fn() };
let pathname = "/signup";
let session = null;
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => pathname }));
const signIn = vi.fn();
const getSession = vi.fn();
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: session, status: session ? "authenticated" : "unauthenticated" }), signIn: (...a) => signIn(...a), getSession: () => getSession() }));
const apiFetch = vi.fn();
vi.mock("@/lib/apiFetch", () => ({ apiFetch: (...a) => apiFetch(...a) }));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("framer-motion", () => ({ motion: new Proxy({}, { get: () => (props) => <div {...props} /> }), AnimatePresence: ({ children }) => children }));

const { default: Signup } = await import("@/Component/Auth/SignupComponent.jsx");
const { default: Login } = await import("@/Component/Auth/LoginComponent.jsx");

const fill = (container, values) => {
  for (const [name, value] of Object.entries(values)) {
    const el = container.querySelector(`[name="${name}"]`);
    fireEvent.change(el, { target: { name, value } });
  }
};
const valid = { username: "Jane Doe", email: "jane@example.com", phoneNumber: "9876543210", address: "Pune, India", password: "Correct-Horse-9-Battery" };

beforeEach(() => {
  session = null;
  pathname = "/signup";
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("register -> automatic login", () => {
  it("signs a new consumer in and sends them to /mess (no second login)", async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ message: "ok" }) });
    signIn.mockResolvedValue({ error: null });
    getSession.mockResolvedValue({ user: { id: "u1" } });

    const { container } = render(<Signup />);
    fill(container, valid);
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/mess"));
    expect(apiFetch.mock.calls[0][0]).toBe("/api/auth/signup");
    expect(signIn).toHaveBeenCalledWith("credentials", { redirect: false, email: valid.email, password: valid.password });
    expect(router.push).not.toHaveBeenCalledWith("/login");
  });

  it("signs a new owner in and sends them to /owner", async () => {
    pathname = "/register-owner";
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    signIn.mockResolvedValue({ error: null });
    getSession.mockResolvedValue({ user: { id: "o1", isOwner: true } });

    const { container } = render(<Signup />);
    fill(container, { ...valid, upi: "jane@upi" });
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/owner"));
    expect(apiFetch.mock.calls[0][0]).toBe("/api/auth/register-owner");
  });

  it("falls back to the login page only if the automatic sign-in fails", async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    signIn.mockResolvedValue({ error: "Invalid credentials" });
    const { container } = render(<Signup />);
    fill(container, valid);
    fireEvent.submit(container.querySelector("form"));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
  });

  it("does not sign in when registration fails", async () => {
    apiFetch.mockResolvedValue({ ok: false, json: async () => ({ message: "A user with this email already exists." }) });
    const { container } = render(<Signup />);
    fill(container, valid);
    fireEvent.submit(container.querySelector("form"));
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    expect(signIn).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("rejects a weak password before calling the server", () => {
    const { container } = render(<Signup />);
    fill(container, { ...valid, password: "short" });
    fireEvent.submit(container.querySelector("form"));
    expect(apiFetch).not.toHaveBeenCalled();
  });
});

describe("signed-in visitors never see the forms", () => {
  it.each([
    [{ id: "c" }, "/mess"],
    [{ id: "o", isOwner: true }, "/owner"],
    [{ id: "a", isAdmin: true }, "/admin"],
  ])("login page redirects %j to %s immediately", async (user, target) => {
    session = { user };
    const { container } = render(<Login />);
    expect(container.querySelector("form")).toBeNull();
    expect(screen.getByText(/Taking you to your dashboard/i)).toBeTruthy();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(target));
  });

  it("register page does the same", async () => {
    session = { user: { id: "c" } };
    const { container } = render(<Signup />);
    expect(container.querySelector("form")).toBeNull();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/mess"));
  });

  it("the login form stays mounted while submitting (no spinner swap)", async () => {
    signIn.mockImplementation(() => new Promise(() => {})); // never resolves
    const { container } = render(<Login />);
    fill(container, { email: "a@b.com", password: "whatever-pass-1!" });
    fireEvent.submit(container.querySelector("form"));
    await waitFor(() => expect(screen.getByText(/Logging in/i)).toBeTruthy());
    expect(container.querySelector("form")).not.toBeNull();
  });
});

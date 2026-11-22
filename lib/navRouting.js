/**
 * Which navigation chrome a route shows. One place instead of every page
 * rendering (and re-mounting) its own sidebar, so the sidebar stays put while
 * only the page content changes.
 *
 * The table mirrors what each page rendered before the shell existed:
 *   consumer sidebar, owner sidebar, admin sidebar, or nothing
 * ("none" is also used for unknown routes, i.e. the 404 page).
 */
export const NAV = Object.freeze({ NONE: "none", CONSUMER: "consumer", OWNER: "owner", ADMIN: "admin" });

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const re = (s) => new RegExp(`^${s}/?$`);

const RULES = [
  // no chrome
  [re("/forgot-password"), NAV.NONE],
  [re("/reset-password/[^/]+"), NAV.NONE],
  [re(`/admin/${UUID}`), NAV.NONE], // admin profile keeps its own top bar
  [re(`/admin/all-messes/${UUID}`), NAV.NONE],
  [re(`/admin/all-messes/${UUID}/reviews`), NAV.NONE],
  [re(`/consumer/${UUID}/edit-info`), NAV.NONE],
  [re(`/consumer/${UUID}/delete`), NAV.NONE],
  [re(`/mess/${UUID}/info`), NAV.NONE],

  // admin
  [re("/admin"), NAV.ADMIN],
  [re("/admin/all-users"), NAV.ADMIN],
  [re("/admin/all-messes"), NAV.ADMIN],
  [re("/admin/pending-verification"), NAV.ADMIN],
  [re("/mess/pending-verification"), NAV.ADMIN],

  // owner
  [re("/owner"), NAV.OWNER],
  [re(`/owner/${UUID}(/.*)?`), NAV.OWNER],
  [re(`/mess/${UUID}/(orders|edit-info|messages|update-menu)`), NAV.OWNER],

  // consumer
  [re(""), NAV.CONSUMER],
  [re("/mess"), NAV.CONSUMER],
  [re(`/mess/${UUID}`), NAV.CONSUMER],
  [re(`/mess/${UUID}/new-customer`), NAV.CONSUMER],
  [re(`/consumer/${UUID}(/.*)?`), NAV.CONSUMER],
  [re("/terms-and-conditions"), NAV.CONSUMER],
  [re("/login"), NAV.CONSUMER],
  [re("/signup"), NAV.CONSUMER],
  [re("/register-owner"), NAV.CONSUMER],
];

/**
 * @param {string} pathname
 * @param {{ isAdmin?: boolean, isOwner?: boolean } | null | undefined} user
 */
export function navKindFor(pathname, user) {
  const path = (pathname || "/").split("?")[0];
  const normalized = path === "/" ? "" : path.replace(/\/+$/, "");

  // "/notifications" shows the sidebar that matches the viewer's role
  if (normalized === "/notifications") return user?.isOwner ? NAV.OWNER : NAV.CONSUMER;

  const hit = RULES.find(([pattern]) => pattern.test(normalized));
  if (!hit) return NAV.NONE;

  const kind = hit[1];
  // a route that needs a role the viewer does not have falls back to the public sidebar
  if (kind === NAV.ADMIN && !user?.isAdmin) return NAV.CONSUMER;
  if (kind === NAV.OWNER && !user?.isOwner) return NAV.CONSUMER;
  return kind;
}

/** Tailwind padding that keeps page content clear of the fixed sidebar (matches the pages' own classes). */
export function contentPaddingFor(kind) {
  if (kind === NAV.CONSUMER) return "md:pl-[25vw]";
  if (kind === NAV.OWNER) return "md:pl-[var(--owner-sidebar-width,280px)]";
  if (kind === NAV.ADMIN) return "md:pl-[var(--sidebar-width,280px)]";
  return "";
}

/** Where a signed-in user belongs. Used by redirects after login / register. */
export function homeFor(user) {
  if (user?.isAdmin) return "/admin";
  if (user?.isOwner) return "/owner";
  return "/mess";
}

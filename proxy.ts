import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Route protection (runs before any page renders).
 *
 *  - /login, /signup, /register-owner: signed-in users go straight to their own dashboard
 *  - /admin/**     : admins only
 *  - /owner/**     : owners only
 *  - /consumer/**  : any signed-in user, and `/consumer/<id>/...` must be YOUR id
 *                    (admins may look at any id)
 *  - /owner/<id> , /owner/<id>/mess-details , /owner/<id>/new-mess carry the
 *    OWNER id and must match the token; other /owner/<id>/... pages carry a MESS
 *    id and are authorised by the API (mess.owner_id === session user)
 *  - identifiers in the URL must be UUIDs, otherwise 404 (no DB hit, no probing)
 *
 * This is defence in depth for page navigation. The APIs enforce the same
 * rules independently, so skipping the UI never skips authorisation.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const AUTH_PAGES = ["/login", "/signup", "/register-owner"];

type Token = { id?: string; isAdmin?: boolean; isOwner?: boolean } | null;

const home = (t: NonNullable<Token>) => (t.isAdmin ? "/admin" : t.isOwner ? "/owner" : "/mess");

function redirect(req: NextRequest, to: string) {
  const url = req.nextUrl.clone();
  url.pathname = to;
  url.search = "";
  return NextResponse.redirect(url);
}

function notFound(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/404";
  return NextResponse.rewrite(url, { status: 404 });
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const segments = pathname.split("/").filter(Boolean);

  let token: Token = null;
  try {
    token = (await getToken({ req, secret: process.env.NEXTAUTH_SECRET })) as Token;
  } catch {
    token = null;
  }

  // sign-in pages
  if (AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return token ? redirect(req, home(token as NonNullable<Token>)) : NextResponse.next();
  }

  // landing page: admins and owners go straight to their dashboard (real HTTP redirect, no flash)
  if (pathname === "/") {
    return token && (token.isAdmin || token.isOwner) ? redirect(req, home(token)) : NextResponse.next();
  }

  const area = segments[0];

  if (area === "admin") {
    if (!token) return redirect(req, "/login");
    if (!token.isAdmin) return redirect(req, "/");
    if (segments[1] && !["all-messes", "all-users", "pending-verification"].includes(segments[1]) && !UUID.test(segments[1])) return notFound(req);
    if (segments[1] === "all-messes" && segments[2] && !UUID.test(segments[2])) return notFound(req);
    return NextResponse.next();
  }

  if (area === "owner") {
    if (!token) return redirect(req, "/login");
    if (!token.isOwner) return redirect(req, "/");
    const id = segments[1];
    if (id) {
      if (!UUID.test(id)) return notFound(req);
      const ownerScoped = segments.length === 2 || ["mess-details", "new-mess"].includes(segments[2]);
      if (ownerScoped && id !== token.id) return redirect(req, "/owner");
    }
    return NextResponse.next();
  }

  if (area === "consumer") {
    if (!token) return redirect(req, "/login");
    const id = segments[1];
    if (id) {
      if (!UUID.test(id)) return notFound(req);
      if (id !== token.id && !token.isAdmin) return redirect(req, home(token as NonNullable<Token>));
    }
    return NextResponse.next();
  }

  if (area === "mess" && segments[1]) {
    if (segments[1] === "pending-verification") {
      if (!token) return redirect(req, "/login");
      return token.isAdmin ? NextResponse.next() : redirect(req, "/");
    }
    if (!UUID.test(segments[1])) return notFound(req);

    const sub = segments[2] || "";
    if (["edit-info", "update-menu", "messages", "orders"].includes(sub)) {
      if (!token) return redirect(req, "/login");
      if (!token.isOwner) return redirect(req, "/mess");
    }
    if (sub === "new-customer" && !token) return redirect(req, "/login");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/register-owner",
    "/admin/:path*",
    "/owner/:path*",
    "/consumer/:path*",
    "/mess/:path*",
  ],
};

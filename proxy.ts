import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = req.nextUrl;

  const protectedAuthPaths = [
    "/login",
    "/signup",
    "/auth/login",
    "/auth/signup",
    "/(auth)/login",
    "/(auth)/signup",
    "/auth",
  ];

  const isAuthPath = protectedAuthPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isAuthPath) return NextResponse.next();

  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.error("middleware token check error:", err);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/auth/:path*", "/(auth)/:path*", ],
};

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Placeholder so the Socket.IO path exists under Next; the real server is attached in server.js.
export function GET() {
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store, max-age=0" } });
}

export const POST = GET;

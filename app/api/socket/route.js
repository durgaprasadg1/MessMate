import { NextResponse } from "next/server";

// Stub endpoint for deployments that do not run a custom Socket.IO server.
// Return no-content so stale clients do not surface hard 4xx errors.
export const dynamic = "force-dynamic";

export function GET() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },   

  });
}

export const POST = GET;

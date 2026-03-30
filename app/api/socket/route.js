import { NextResponse } from "next/server";

// Stub endpoint to silence legacy socket.io calls in older cached bundles.
// This returns a clear message instead of a 404, without enabling sockets.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { message: "Sockets are disabled in this build. Please refresh." },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

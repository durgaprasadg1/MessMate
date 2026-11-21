import { NextResponse } from "next/server";

export const json = (data, status = 200, headers) =>
  NextResponse.json(data, { status, headers });

/** Responses that depend on the caller must never be cached by browsers/CDNs. */
export const NO_STORE = { "Cache-Control": "no-store" };

import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { getJsonCache, setJsonCache } from "../../../lib/redis";

const TTL_SECONDS = 60 * 60 * 18;

export async function GET() {
  try {
    const tenantId = "public";
    const cacheKey = `tenant:${tenantId}:consumers:all`;
    const cached = await getJsonCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { status: 200 });
    }

    const { data: consumers, error } = await supabase
      .from("consumer")
      .select("*, reviews:review(*)");
    if (error) throw error;

    await setJsonCache(cacheKey, consumers, TTL_SECONDS);
    return NextResponse.json(consumers, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch messes" },
      { status: 500 },
    );
  }
}

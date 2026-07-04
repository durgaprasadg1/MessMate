import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { getJsonCache, setJsonCache } from "../../../../lib/redis";

const TTL_SECONDS = 60 * 2;

export async function GET(request, { params }) {
  try {
       const start = Date.now();

    const { consumerid } = await params;
    const tenantId = request.headers.get("x-tenant-id") || "public";
    const cacheKey = `tenant:${tenantId}:consumer:${consumerid}:profile`;
    const cached = await getJsonCache(cacheKey);
    if (cached !== null) {

      return NextResponse.json(
        { consumer: cached, message: "Consumer found" },
        { status: 200 },
      );
    } 

    const { data: consumer, error } = await supabase
      .from("consumer")
      .select("*")
      .eq("id", consumerid)
      .single();
    if (error) throw error;

    if (!consumer) {
      return NextResponse.json(
        { message: "Consumer not found" },
        { status: 404 },
      );
    }

    await setJsonCache(cacheKey, consumer, TTL_SECONDS);
//  console.log(`Took: ${Date.now() - start}ms`);
    return NextResponse.json(
      { consumer, message: "Consumer found" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching consumer:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

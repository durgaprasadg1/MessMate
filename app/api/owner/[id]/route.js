import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { getJsonCache, setJsonCache } from "../../../../lib/redis";

const TTL_SECONDS = 60 * 60 * 18;

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get("x-tenant-id") || "public";
    const cacheKey = `tenant:${tenantId}:owner:${id}:profile`;
    const cached = await getJsonCache(cacheKey);
    if (cached !== null) {
      return NextResponse.json(
        { owner: cached, message: "owner found" },
        { status: 200 },
      );
    }

    const { data: owner, error } = await supabase
      .from("owner")
      .select("*, mess(id,name)")
      .eq("id", id)
      .single();
    if (error) throw error;

    if (!owner) {
      return NextResponse.json({ message: "owner not found" }, { status: 404 });
    }

    await setJsonCache(cacheKey, owner, TTL_SECONDS);

    return NextResponse.json(
      { owner, message: "owner found" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching owner:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

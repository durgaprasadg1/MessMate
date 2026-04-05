import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { getJsonCache, setJsonCache } from "../../../../lib/redis";

const TTL_SECONDS = 60 * 60 * 18;

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get("x-tenant-id") || "public";
    const cacheKey = `tenant:${tenantId}:admin:${id}:profile`;
    const cached = await getJsonCache(cacheKey);
    if (cached) {
      return NextResponse.json(
        { admin: cached, message: "Admin found" },
        { status: 200 },
      );
    }

    const { data: admin, error } = await supabase
      .from("admin")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;

    if (!admin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    await setJsonCache(cacheKey, admin, TTL_SECONDS);

    return NextResponse.json(
      { admin, message: "Admin found" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching admin:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

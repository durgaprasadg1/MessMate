import supabase from "@/lib/supabaseClient";
import { getJsonCache, setJsonCache } from "../../../lib/redis";

const TTL_SECONDS = 60 * 60 * 18;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tenantId = "public";
    const cacheKey = `tenant:${tenantId}:admin:users`;
    const cached = await getJsonCache(cacheKey);
    if (cached !== null) {
      return Response.json(cached, { status: 200 });
    }

    const { data: users, error } = await supabase
      .from("consumer")
      .select("id, username, email")
      .order("id", { ascending: false })
      .limit(200);
    if (error) throw error;

    const payload = { success: true, users };
    await setJsonCache(cacheKey, payload, TTL_SECONDS);

    return Response.json(payload, { status: 200 });
  } catch (error) {
    console.error("Users API Error:", error);
    return Response.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

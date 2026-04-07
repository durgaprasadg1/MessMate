import supabase from "@/lib/supabaseClient";
import { getJsonCache, setJsonCache } from "../../../../lib/redis";

const TTL_SECONDS = 60 * 60 * 18;

export async function GET() {
  try {
  const tenantId = "public";
  const cacheKey = `tenant:${tenantId}:admin:dashboard`;
  const cached = await getJsonCache(cacheKey);
  if (cached !== null) {
    return Response.json(cached);
  }

  const { count: totalUsers = 0, error: usersErr } = await supabase
    .from("consumer")
    .select("id", { count: "exact", head: true });
  if (usersErr) throw usersErr;

  const { count: totalMesses = 0, error: messErr } = await supabase
    .from("mess")
    .select("id", { count: "exact", head: true });
  if (messErr) throw messErr;

  const { count: pendingCount = 0, error: pendingErr } = await supabase
    .from("mess")
    .select("id", { count: "exact", head: true })
    .eq("is_verified", false);
  if (pendingErr) throw pendingErr;

  const { data: recentSignups = [], error: recentErr } = await supabase
    .from("consumer")
    .select("id, username, email, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  if (recentErr) throw recentErr;

  const { data: pendingMesses = [], error: pendingListErr } = await supabase
    .from("mess")
    .select("id, name, created_at")
    .eq("is_verified", false)
    .order("created_at", { ascending: false })
    .limit(5);
  if (pendingListErr) throw pendingListErr;

  const payload = {
    stats: {
      totalUsers,
      totalMesses,
      pendingCount,
    },
    recentSignups: (recentSignups || []).map((c) => ({
      id: c.id,
      username: c.username,
      email: c.email,
      joined: c.created_at,
    })),
    pendingMesses: pendingMesses || [],
  };

  await setJsonCache(cacheKey, payload, TTL_SECONDS);

  return Response.json(payload);
  } catch (err) {
    console.error("admin get-all-data failed:", err);
    return new Response(
      JSON.stringify({ message: "Failed to fetch admin data" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

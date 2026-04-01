import supabase from "@/lib/supabaseClient";

export async function GET() {
  const { data: totalUsersAgg } = await supabase
    .from("consumer")
    .select("id", { count: "exact", head: true });
  const totalUsers = totalUsersAgg?.length ?? totalUsersAgg?.count ?? 0;

  const { count: totalMesses = 0 } = await supabase
    .from("mess")
    .select("id", { count: "exact", head: true });

  const { count: pendingCount = 0 } = await supabase
    .from("mess")
    .select("id", { count: "exact", head: true })
    .eq("is_verified", false);

  const { data: recentSignups = [] } = await supabase
    .from("consumer")
    .select("id, username, email, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: pendingMesses = [] } = await supabase
    .from("mess")
    .select("id, name, created_at")
    .eq("is_verified", false)
    .order("created_at", { ascending: false })
    .limit(5);

  return Response.json({
    stats: {
      totalUsers,
      totalMesses,
      pendingCount,
    },
    recentSignups: recentSignups.map((c) => ({
      id: c.id,
      username: c.username,
      email: c.email,
      joined: c.createdAt,
    })),
    pendingMesses,
  });
}

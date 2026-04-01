import supabase from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from("consumer")
      .select("id, username, email")
      .order("id", { ascending: false })
      .limit(200);
    if (error) throw error;

    return Response.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error("Users API Error:", error);
    return Response.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

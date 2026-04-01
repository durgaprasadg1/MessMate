import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import supabase from "@/lib/supabaseClient";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: notifications, error } = await supabase
      .from("notification")
      .select("*")
      .eq("recipient_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;

    const { count: unreadCount = 0 } = await supabase
      .from("notification")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", session.user.id)
      .eq("is_read", false);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("notification")
      .delete()
      .eq("recipient_id", session.user.id);
    if (error) throw error;

    return NextResponse.json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return NextResponse.json(
      { error: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}

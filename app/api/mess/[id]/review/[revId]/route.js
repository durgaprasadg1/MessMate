import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import supabase from "@/lib/supabaseClient";
import { deleteCacheKeys } from "@/lib/redis";

export async function DELETE(request, { params }) {
  try {
    const { id, revId } = await params;
    const tenantId = request.headers.get("x-tenant-id") || "public";
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data: review } = await supabase
      .from("review")
      .select("*")
      .eq("id", revId)
      .single();
    if (!review) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      );
    }

    const authorId = review.authorId;

    let allowed = false;
    if (authorId && authorId === session.user.id) allowed = true;
    if (!allowed) {
      const { data: mess } = await supabase
        .from("mess")
        .select("owner_id")
        .eq("id", id)
        .single();
      const ownerId = mess?.owner_id || null;
      if (ownerId && ownerId === session.user.id) allowed = true;
    }

    if (!allowed) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { data: deletedReview, error } = await supabase
      .from("review")
      .delete()
      .eq("id", revId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!deletedReview) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      );
    }

    await deleteCacheKeys([`tenant:${tenantId}:mess:${id}`]);

    return NextResponse.json(
      { message: "Review Deleted Successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

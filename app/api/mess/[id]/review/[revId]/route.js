import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import supabase from "@/lib/supabaseClient";

export async function DELETE(request, { params }) {
  try {
    const { id, revId } = await params;
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

    await supabase.from("review").delete().eq("id", revId);
    if (!deletedReview) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      );
    }

    // No denormalized array to maintain when using Supabase JSON; nothing else to do.

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

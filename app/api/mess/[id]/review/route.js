import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import supabase from "@/lib/supabaseClient";
import { deleteCacheKeys } from "@/lib/redis";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get("x-tenant-id") || "public";
    if (!id) {
      return NextResponse.json({ message: "Mess ID missing" }, { status: 400 });
    }
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { rating, text } = body;

    if (
      typeof rating !== "number" ||
      rating < 1 ||
      rating > 5 ||
      !text?.trim()
    ) {
      return NextResponse.json(
        { message: "Valid rating (1-5) and non-empty text are required" },
        { status: 400 }
      );
    }
    const { data: consumer } = await supabase
      .from("consumer")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (!consumer)
      return NextResponse.json(
        { message: "Author not found" },
        { status: 404 }
      );

    if (consumer.isBlocked)
      return NextResponse.json(
        {
          message:
            "Your account is blocked by admin due to your activities. You cannot post reviews",
        },
        { status: 403 }
      );

    if (!rating || !text) {
      return NextResponse.json(
        { message: "Rating and text are required" },
        { status: 400 }
      );
    }
    const { data: mess } = await supabase
      .from("mess")
      .select("id")
      .eq("id", id)
      .single();
    if (!mess)
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });

    const { data: review, error } = await supabase
      .from("review")
      .insert({
        rating,
        feedback: text,
        author_id: session.user.id,
        mess_id: id,
      })
      .select()
      .single();
    if (error) throw error;

    await deleteCacheKeys([`tenant:${tenantId}:mess:${id}`]);

    return NextResponse.json(
      { message: " Review added successfully", review },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding review:", error);
    return NextResponse.json(
      { message: " Server error", error: error.message },
      { status: 500 }
    );
  }
}

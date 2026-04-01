import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data: owner, error } = await supabase
      .from("owner")
      .select("*, mess(id,name)")
      .eq("id", id)
      .single();
    if (error) throw error;

    if (!owner) {
      return NextResponse.json({ message: "owner not found" }, { status: 404 });
    }

    return NextResponse.json(
      { owner, message: "owner found" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching owner:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

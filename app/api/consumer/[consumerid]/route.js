import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

export async function GET(request, { params }) {
  try {
    const { consumerid } = await params;
    const { data: consumer, error } = await supabase
      .from("consumer")
      .select("*")
      .eq("id", consumerid)
      .single();
    if (error) throw error;

    if (!consumer) {
      return NextResponse.json(
        { message: "Consumer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { consumer, message: "Consumer found" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching consumer:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

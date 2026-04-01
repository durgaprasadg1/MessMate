import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

export async function GET() {
  try {
    const { data: consumers, error } = await supabase
      .from("consumer")
      .select("*, reviews:review(*)");
    if (error) throw error;
    return NextResponse.json(consumers);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch messes" },
      { status: 500 }
    );
  }
}

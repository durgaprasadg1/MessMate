import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

export async function GET() {
  const { error } = await supabase
    .from("users")
    .select("id")
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

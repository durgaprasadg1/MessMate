import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

export async function PUT(request, { params }) {
  try {
    const { consumerid } =await params;
    const { username, address, phone } = await request.json();

    const { data: updated, error } = await supabase
      .from("consumer")
      .update({ username, address, phone })
      .eq("id", consumerid)
      .select()
      .single();
    if (error) throw error;

    if (!updated) {
      return NextResponse.json({ message: "Consumer not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Updated successfully", updated });
  } catch (error) {
    console.error("Error updating consumer info:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

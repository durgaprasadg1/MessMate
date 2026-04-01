import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data: admin, error } = await supabase
      .from("admin")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;

    if (!admin) {
      return NextResponse.json(
        { message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { admin, message: "Admin found" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching admin:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

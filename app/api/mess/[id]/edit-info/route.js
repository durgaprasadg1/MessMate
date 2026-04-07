import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { deleteCacheKeys } from "@/lib/redis";

export async function PUT(request, { params }) {
  try {
    const { id } = await params; 
    const tenantId = request.headers.get("x-tenant-id") || "public";
    const body = await request.json();

    const { name, address, phoneNumber, category, limits, description } = body;


    const { data: updatedMess, error } = await supabase
      .from("mess")
      .update({
        name,
        address,
        phone_number: phoneNumber,
        category,
        is_limited: limits,
        description,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    if (!updatedMess) {
      return NextResponse.json(
        { message: "Mess not found" },
        { status: 404 }
      );
    }

    await deleteCacheKeys([
      `tenant:${tenantId}:mess:${id}`,
      `tenant:${tenantId}:messes:all`,
      `tenant:${tenantId}:messes:pending`,
      `tenant:${tenantId}:owner:${updatedMess.owner_id}:messes`,
    ]);

    return NextResponse.json({
      message: "Mess updated successfully",
      mess: updatedMess,
    });
  } catch (error) {
    console.error("Error updating mess info:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export async function PUT(request, { params }) {
  try {
    const { id } = await params; 
    const body = await request.json();

    const { name, address, phoneNumber, category, limits, description } = body;


    await connectDB();
    const { default: Mess } = await import("@/models/mess");

    const updatedMess = await Mess.findByIdAndUpdate(
      id,
      { name, address, phoneNumber, category, limits, description },
      { new: true, runValidators: true }
    );

    if (!updatedMess) {
      return NextResponse.json(
        { message: "Mess not found" },
        { status: 404 }
      );
    }

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

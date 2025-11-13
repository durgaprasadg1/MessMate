import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export async function PUT(request, { params }) {
  try {
    const { consumerid } =await params;
    const { username, address, phone } = await request.json();

    await connectDB();
    const { default: Consumer } = await import("@/models/consumer");

    const updated = await Consumer.findByIdAndUpdate(
      consumerid,
      { username, address, phone },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: "Consumer not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Updated successfully", updated });
  } catch (error) {
    console.error("Error updating consumer info:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { consumerid } = await params;
    const { default: Consumer } = await import("../../../../models/consumer");

    const consumer = await Consumer.findById(consumerid);

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

import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";

export async function GET() {
  try {
    await connectDB();
    const { default: Consumer } = await import("../../../models/consumer");
    const consumers = await Consumer.find().populate("reviews");
    return NextResponse.json(consumers);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch messes" },
      { status: 500 }
    );
  }
}

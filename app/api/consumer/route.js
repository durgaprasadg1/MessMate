import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import Consumer from "../../../models/consumer";

export async function GET() {
  try {
    await connectDB();
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

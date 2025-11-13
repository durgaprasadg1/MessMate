import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import Mess from "../../../../../models/mess";
import Review from "../../../../../models/reviews";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: "Mess ID missing" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { rating, text } = body;

    if (!rating || !text) {
      return NextResponse.json(
        { message: "Rating and text are required" },
        { status: 400 }
      );
    }

    const review = await Review.create({
      rating,
      feedback: text,
      author: session.user.id,
    });

    const mess = await Mess.findById(id);
    if (!mess)
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });

    mess.reviews.push(review._id);
    await mess.save();

    return NextResponse.json(
      { message: " Review added successfully", review },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding review:", error);
    return NextResponse.json(
      { message: " Server error", error: error.message },
      { status: 500 }
    );
  }
}

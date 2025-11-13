import { NextResponse } from "next/server";
import { connectDB } from "../../../../../../lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(request, { params }) {
  try {
    const { id, revId } = await params;
    // require session
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { default: Review } = await import(
      "../../../../../../models/reviews"
    );
    const { default: Mess } = await import("../../../../../../models/mess");

    const review = await Review.findById(revId);
    if (!review) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      );
    }

    const authorId = review.author ? review.author.toString() : null;

    // allow deletion by review author or mess owner
    let allowed = false;
    if (authorId && authorId === session.user.id) allowed = true;
    if (!allowed) {
      const mess = await Mess.findById(id);
      const ownerId = mess && mess.owner ? mess.owner.toString() : null;
      if (ownerId && ownerId === session.user.id) allowed = true;
    }

    if (!allowed) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // remove review
    const deletedReview = await Review.findByIdAndDelete(revId);
    if (!deletedReview) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      );
    }

    // also remove reference from mess
    const mess = await Mess.findById(id);
    if (mess) {
      mess.reviews = (mess.reviews || []).filter(
        (r) => r.toString() !== revId.toString()
      );
      await mess.save();
    }

    return NextResponse.json(
      { message: "Review Deleted Successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

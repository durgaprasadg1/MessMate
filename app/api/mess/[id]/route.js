import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const { default: Mess } = await import("../../../../models/mess");
    const { default: Menu } = await import("../../../../models/menu");

    const mess = await Mess.findById(id)
      .populate("alert")
      .populate("vegMenuRef")
      .populate("nonVegMenuRef")
      .populate({
        path: "reviews",
        populate: {
          path: "author",
        },
      });
    //     let avg = 0;
    //     if (mess.reviews && mess.reviews.length > 0) {
    //       avg =
    //         mess.reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
    //         mess.reviews.length;
    //     }

    if (!mess) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }
    // return the mess document directly so consumers can use `mess.*` rather than `mess.mess.*`
    return NextResponse.json(mess, { status: 200 });
  } catch (error) {
    console.error("Error fetching mess by ID:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { default: Mess } = await import("../../../../models/mess");
    const body = await request.json();

    if (body.action === "toggleOpen") {
      const mess = await Mess.findById(id);
      if (!mess)
        return NextResponse.json(
          { message: "Mess not found" },
          { status: 404 }
        );

      const ownerId = mess.owner ? mess.owner.toString() : null;
      if (!ownerId || ownerId !== session.user.id) {
        return NextResponse.json(
          { message: "Forbidden: not the owner" },
          { status: 403 }
        );
      }

      mess.isOpen = !mess.isOpen;
      await mess.save();

      return NextResponse.json(
        { message: "Mess open/close updated", mess },
        { status: 200 }
      );
    }

    if (body.action === "updateInfo") {
      const { name, address, vegPrice, nonVegPrice, description } = body;

      const mess = await Mess.findById(id);
      if (!mess)
        return NextResponse.json(
          { message: "Mess not found" },
          { status: 404 }
        );
      const ownerId = mess.owner ? mess.owner.toString() : null;
      if (!ownerId || ownerId !== session.user.id) {
        return NextResponse.json(
          { message: "Forbidden: not the owner" },
          { status: 403 }
        );
      }

      const updatedMess = await Mess.findByIdAndUpdate(
        id,
        { name, address, vegPrice, nonVegPrice, description },
        { new: true }
      );

      if (!updatedMess)
        return NextResponse.json(
          { message: "Mess not found" },
          { status: 404 }
        );

      return NextResponse.json(
        { message: "Mess info updated successfully", updatedMess },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const { default: Mess } = await import("../../../../models/mess");
    const deletedMess = await Mess.findByIdAndDelete(id);

    if (!deletedMess) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Mess Deleted Successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching mess by ID:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

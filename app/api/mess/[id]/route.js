import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { refresh } from "next/cache";

export async function GET(request, { params }) {
  try {
    const { id } = await params || {};
    await connectDB();
    const { default: Mess } = await import("../../../../models/mess");
    const { default: Menu } = await import("../../../../models/menu");
    const { default: Message } = await import("../../../../models/message");

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

    if (!mess) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }
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
    const { id } = await  params || {};
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { default: Mess } = await import("../../../../models/mess");
    const body = await request.json();

    console.log(
      `PATCH /api/mess/${id} called by session user:`,
      session?.user?.id
    );

    
      const mess = await Mess.findById(id);
      console.log("Found mess:", !!mess, "for id:", id);
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
      const updatedMess = await Mess.findByIdAndUpdate(id,
        { $set: { isOpen: !mess.isOpen } },
        { new: true }
      );
      
      return NextResponse.json(
        { message: updatedMess.isOpen ? "Mess Opened" : "Mess Closed", mess: updatedMess },
        { status: 200 }
      );

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
    const { id } = await params || {};
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

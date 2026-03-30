import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    const { id } = params || {};

    // DEBUG: Log received ID
    console.log("[API GET /mess/:id] Received id:", id, "Type:", typeof id);

    // Validate ObjectId format
    if (!id || id.length !== 24) {
      console.warn(
        "[API GET /mess/:id] Invalid ID format. Expected 24-char hex string, got:",
        id,
      );
    }

    await connectDB();
    const { default: Mess } = await import("../../../../models/mess");
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
      console.warn("[API GET /mess/:id] Mess not found for id:", id);
      // Optional debug info to help diagnose prod issues without breaking clients
      const debug = request.nextUrl.searchParams.get("debug") === "1";
      if (debug) {
        const count = await Mess.countDocuments();
        const sample = await Mess.find({}, { _id: 1 }).limit(5);
        return NextResponse.json(
          {
            message: "Mess not found",
            id,
            collectionCount: count,
            sampleIds: sample.map((d) => String(d._id)),
            dbName: process.env.MONGODB_DBNAME || "messmate",
            uriHost:
              (process.env.MONGODB_URI || "").split("@").pop()?.split("/")[0] ||
              null,
          },
          { status: 404 },
        );
      }
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    console.log("[API GET /mess/:id] Found mess:", mess._id, mess.name);
    return NextResponse.json(mess, { status: 200 });
  } catch (error) {
    console.error("[API GET /mess/:id] Error fetching mess by ID:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params || {};
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { default: Mess } = await import("../../../../models/mess");
    const body = await request.json();

    const mess = await Mess.findById(id);
    if (!mess)
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });

    const ownerId = mess.owner ? mess.owner.toString() : null;
    if (!ownerId || ownerId !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden: not the owner" },
        { status: 403 },
      );
    }
    const updatedMess = await Mess.findByIdAndUpdate(
      id,
      { $set: { isOpen: !mess.isOpen } },
      { new: true },
    );

    return NextResponse.json(
      {
        message: updatedMess.isOpen ? "Mess Opened" : "Mess Closed",
        mess: updatedMess,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params || {};
    await connectDB();
    const { default: Mess } = await import("../../../../models/mess");
    const deletedMess = await Mess.findByIdAndDelete(id);

    if (!deletedMess) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Mess Deleted Successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching mess by ID:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}

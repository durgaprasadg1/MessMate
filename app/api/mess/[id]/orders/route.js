import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    let messId = id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid Mess ID format" },
        { status: 400 }
      );
    }

    await connectDB();

    const { default: Order } = await import("@/models/order");
    const { default: Mess } = await import("@/models/mess");

    const messDoc = await Mess.findById(id).select("owner name");
    if (!messDoc) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    const messOwnerId = messDoc.owner ? messDoc.owner.toString() : null;

    const messObjectId = new mongoose.Types.ObjectId(id);

    const orders = await Order.find({ mess: messObjectId })
      .populate("consumer", "username email")
      .sort({ createdAt: -1 })
      .lean();

    if (!orders.length) {
      return NextResponse.json(
        { message: "No orders found for this Mess", orders: [], messOwnerId },
        { status: 200 }
      );
    }

    const plainOrders = orders.map((o) => ({
      _id: String(o._id),
      consumer: o.consumer
        ? {
            _id: String(o.consumer._id),
            username: o.consumer.username,
            email: o.consumer.email,
          }
        : null,
      noOfPlate: o.noOfPlate ?? 0,
      selectedDishName: o.selectedDishName ?? null,
      totalPrice: o.totalPrice ?? 0,
      status: o.status ?? "",
      isTaken: !!o.isTaken,
      done: !!o.done,
      refundInitiated: !!o.refundInitiated,
      isCancelled: !!o.isCancelled,
      createdAt: o.createdAt ? o.createdAt.toISOString() : null,
    }));

    return NextResponse.json(
      { orders: plainOrders, messOwnerId, messId },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/mess/[id]/orders error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const { default: Order } = await import("@/models/order");
    const { default: Mess } = await import("@/models/mess");
    const { default: Consumer } = await import("@/models/consumer");

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const mess = await Mess.findById(id);
    if (!mess)
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });

    if (!mess.owner || mess.owner.toString() !== session.user.id)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const completed = await Order.find({
      mess: id,
      $or: [{ done: true }, { status: "failed" }, { status: "refunded" }],
    }).select("_id");

    if (!completed.length) {
      return NextResponse.json(
        { message: "No completed or failed orders to delete", deleted: 0 },
        { status: 200 }
      );
    }

    const ids = completed.map((d) => d._id);

    await Order.deleteMany({ _id: { $in: ids } });

    try {
      await Mess.findByIdAndUpdate(id, { $pull: { orders: { $in: ids } } });
      await Consumer.updateMany(
        { orders: { $in: ids } },
        { $pull: { orders: { $in: ids } } }
      );
    } catch (e) {
      console.error("Failed to clean up order refs:", e);
    }

    return NextResponse.json(
      { message: "Deleted completed or failed orders", deleted: ids.length },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE /api/mess/[id]/orders error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}


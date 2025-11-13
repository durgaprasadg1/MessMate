import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { consumerid } = await params;

    if (session.user.id !== consumerid) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { default: Order } = await import("@/models/order");

    const orders = await Order.find({ consumer: consumerid })
      .populate("mess")
      .sort({ createdAt: -1 })
      .lean();

    const plainOrders = orders.map((o) => ({
      _id: String(o._id),
      mess: o.mess ? { _id: String(o.mess._id), name: o.mess.name } : null,
      consumer: o.consumer ? String(o.consumer) : null,
      noOfPlate: o.noOfPlate ?? 0,
      selectedDishName: o.selectedDishName ?? null,
      totalPrice: o.totalPrice ?? 0,
      status: o.status ?? "",
      isTaken: !!o.isTaken,
      refundInitiated: !!o.refundInitiated,
      done: !!o.done,
      isCancelled: !!o.isCancelled,
      createdAt: o.createdAt ? o.createdAt.toISOString() : null,
    }));

    return NextResponse.json(
      { success: true, orders: plainOrders },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching consumer orders:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch orders",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { consumerid } = await params;

    if (session.user.id !== consumerid) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { default: Order } = await import("@/models/order");
    const { default: Mess } = await import("@/models/mess");
    const { default: Consumer } = await import("@/models/consumer");

    const toDelete = await Order.find({
      consumer: consumerid,
      $or: [
        { done: true },
        { isCancelled: true },
        { status: { $in: ["refunded", "failed", "completed"] } },
      ],
    }).lean();

    if (!toDelete || toDelete.length === 0) {
      return NextResponse.json(
        { message: "No completed/cancelled orders to clear", deleted: 0 },
        { status: 200 }
      );
    }

    const ids = toDelete.map((o) => o._id);
    const messIds = Array.from(
      new Set(toDelete.map((o) => String(o.mess)).filter(Boolean))
    );

    const del = await Order.deleteMany({ _id: { $in: ids } });

    try {
      if (messIds.length > 0) {
        await Mess.updateMany(
          { _id: { $in: messIds } },
          { $pull: { orders: { $in: ids } } }
        );
      }
      await Consumer.findByIdAndUpdate(consumerid, {
        $pull: { orders: { $in: ids } },
      });
    } catch (e) {
      console.error("Failed to pull order refs on clear history:", e);
    }

    return NextResponse.json(
      { message: "Cleared history", deleted: del.deletedCount || ids.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error clearing consumer history:", error);
    return NextResponse.json(
      { message: "Failed to clear history", error: error.message },
      { status: 500 }
    );
  }
}

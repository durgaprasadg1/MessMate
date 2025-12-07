import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request, { params }) {
  try {
    const { id, orderid } = await params;
    const body = await request.json();
    const action = body.action;
    await connectDB();
    const { default: Order } = await import("@/models/order");
    const { default: Mess } = await import("@/models/mess");
    const { default: Consumer } = await import("@/models/consumer");

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const order = await Order.findById(orderid);
    if (!order)
      return NextResponse.json({ message: "Order not found" }, { status: 404 });

    if (action === "cancel") {
      if (order.isTaken)
        return NextResponse.json(
          { message: "Cannot cancel, order already taken" },
          { status: 403 }
        );
      if (order.consumer.toString() !== session.user.id)
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      try {
        order.isCancelled = true;
        if (order.status === "paid") {
          order.refundInitiated = true;
        }
        order.status = order.status === "paid" ? "failed" : order.status;
        await order.save();

        await Mess.findByIdAndUpdate(order.mess, {
          $pull: { orders: order._id },
        });
        await Consumer.findByIdAndUpdate(order.consumer, {
          $pull: { orders: order._id },
        });

        return NextResponse.json(
          { message: "Order cancelled; refund will be started soon" },
          { status: 200 }
        );
      } catch (e) {
        console.error("Cancel order failed", e);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
      }
    }

    if (action === "take") {
      const mess = await Mess.findById(order.mess);
      if (!mess)
        return NextResponse.json(
          { message: "Mess not found" },
          { status: 404 }
        );
      if (!mess.owner || mess.owner.toString() !== session.user.id)
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      order.isTaken = true;
      await order.save();
      return NextResponse.json(
        { message: "Order marked as taken" },
        { status: 200 }
      );
    }

    if (action === "refund" || action === "returnPayment") {
      const mess = await Mess.findById(order.mess);
      if (!mess)
        return NextResponse.json(
          { message: "Mess not found" },
          { status: 404 }
        );
      if (!mess.owner || mess.owner.toString() !== session.user.id)
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      try {
        order.isCancelled = true;
        order.refundInitiated = true;
        order.status = order.status === "paid" ? "refunded" : "failed";
        await order.save();

        await Mess.findByIdAndUpdate(order.mess, {
          $pull: { orders: order._id },
        });
        await Consumer.findByIdAndUpdate(order.consumer, {
          $pull: { orders: order._id },
        });

        return NextResponse.json(
          { message: "Refund initiated and order marked cancelled" },
          { status: 200 }
        );
      } catch (e) {
        console.error("Refund order failed", e);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
      }
    }

    if (action === "markDone") {
      const mess = await Mess.findById(order.mess);
      if (!mess)
        return NextResponse.json(
          { message: "Mess not found" },
          { status: 404 }
        );
      if (!mess.owner || mess.owner.toString() !== session.user.id)
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      order.done = true;
      order.status = "completed";
      await order.save();
      return NextResponse.json(
        { message: "Order marked completed" },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Order PATCH error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id, orderid } = await params;
    await connectDB();
    const { default: Order } = await import("@/models/order");
    const { default: Mess } = await import("@/models/mess");
    const { default: Consumer } = await import("@/models/consumer");
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const order = await Order.findById(orderid);
    if (!order)
      return NextResponse.json({ message: "Order not found" }, { status: 404 });

    const mess = await Mess.findById(order.mess);
    if (!mess)
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    if (!mess.owner || mess.owner.toString() !== session.user.id)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    if (order.done)
      return NextResponse.json(
        { message: "Cannot delete a completed order" },
        { status: 400 }
      );

    try {
      await Order.findByIdAndDelete(orderid);

      await Mess.findByIdAndUpdate(mess._id, { $pull: { orders: orderid } });
      await Consumer.findByIdAndUpdate(order.consumer, {
        $pull: { orders: orderid },
      });

      return NextResponse.json({ message: "Order deleted" }, { status: 200 });
    } catch (e) {
      console.error("Delete order failed", e);
      return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
  } catch (err) {
    console.error("Order DELETE error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}

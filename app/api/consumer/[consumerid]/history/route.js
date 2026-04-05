import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import supabase from "@/lib/supabaseClient";
import {
  deleteCacheKeys,
  getJsonCache,
  setJsonCache,
} from "../../../../lib/redis";

const TTL_SECONDS = 60 * 60 * 18;

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { consumerid } = await params;

    if (session.user.id !== consumerid) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const tenantId = request.headers.get("x-tenant-id") || "public";
    const cacheKey = `tenant:${tenantId}:consumer:${consumerid}:history`;
    const cached = await getJsonCache(cacheKey);
    if (cached) {
      return NextResponse.json(
        { success: true, orders: cached },
        { status: 200 },
      );
    }

    const { data: orders = [] } = await supabase
      .from("order")
      .select(
        "id, mess_id, consumer_id, no_of_plate, selected_dish_name, selected_dish_price, total_price, status, is_taken, refund_initiated, done, is_cancelled, created_at, mess:mess_id(id,name)",
      )
      .eq("consumer_id", consumerid)
      .order("created_at", { ascending: false });

    const plainOrders = orders.map((o) => ({
      _id: o.id,
      mess: o.mess ? { _id: o.mess.id, name: o.mess.name } : null,
      consumer: o.consumer_id ?? null,
      noOfPlate: o.no_of_plate ?? 0,
      selectedDishName: o.selected_dish_name ?? null,
      selectedDishPrice: o.selected_dish_price ?? 0,
      totalPrice: o.total_price ?? 0,
      status: o.status ?? "",
      isTaken: !!o.is_taken,
      refundInitiated: !!o.refund_initiated,
      done: !!o.done,
      isCancelled: !!o.is_cancelled,
      createdAt: o.created_at ? o.created_at : null,
    }));

    await setJsonCache(cacheKey, plainOrders, TTL_SECONDS);

    return NextResponse.json(
      { success: true, orders: plainOrders },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching consumer orders:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch orders",
        error: error.message,
      },
      { status: 500 },
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

    const tenantId = request.headers.get("x-tenant-id") || "public";
    const cacheKey = `tenant:${tenantId}:consumer:${consumerid}:history`;

    const { data: toDelete = [] } = await supabase
      .from("order")
      .select("id")
      .eq("consumer_id", consumerid)
      .or(
        "done.eq.true,is_cancelled.eq.true,status.in.(refunded,failed,completed)",
      );

    if (!toDelete || toDelete.length === 0) {
      return NextResponse.json(
        { message: "No completed/cancelled orders to clear", deleted: 0 },
        { status: 200 },
      );
    }

    const ids = toDelete.map((o) => o.id);

    const { error: delErr } = await supabase
      .from("order")
      .delete()
      .in("id", ids);
    if (delErr) throw delErr;

    await deleteCacheKeys([cacheKey]);

    return NextResponse.json(
      { message: "Cleared history", deleted: del.deletedCount || ids.length },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error clearing consumer history:", error);
    return NextResponse.json(
      { message: "Failed to clear history", error: error.message },
      { status: 500 },
    );
  }
}

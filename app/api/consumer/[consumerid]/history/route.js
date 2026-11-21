import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { getJsonCache, setJsonCache, deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { orderRepository } from "@/lib/server/repositories/orders";
import { requireSelf } from "@/lib/server/auth/guards";

export const GET = createRoute({ name: "consumer.history", auth: "session", uuid: ["consumerid"] }, async ({ params, session }) => {
  requireSelf(session, params.consumerid);
  const key = cacheKeys.consumerHistory(params.consumerid);
  const cached = await getJsonCache(key);
  if (cached !== null) return json({ success: true, orders: cached });

  const orders = await orderRepository.listForConsumer(params.consumerid);
  const plain = orders.map((o) => ({
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
    createdAt: o.created_at ?? null,
  }));
  await setJsonCache(key, plain, 120);
  return json({ success: true, orders: plain });
});

export const DELETE = createRoute(
  { name: "consumer.history.clear", auth: "session", uuid: ["consumerid"], bodyType: "none" },
  async ({ params, session }) => {
    requireSelf(session, params.consumerid);
    const ids = await orderRepository.idsClearableForConsumer(params.consumerid);
    if (!ids.length) return json({ message: "No completed/cancelled orders to clear", deleted: 0 });
    await orderRepository.deleteMany(ids);
    await deleteCacheKeys([cacheKeys.consumerHistory(params.consumerid)]);
    return json({ message: "Cleared history", deleted: ids.length });
  },
);

import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { getJsonCache, setJsonCache, deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { orderRepository } from "@/lib/server/repositories/orders";
import { requireMessOwner } from "@/lib/server/auth/guards";

// Orders contain customer names / e-mails: only the mess owner may read them.
export const GET = createRoute({ name: "mess.orders.list", auth: "owner", uuid: ["id"] }, async ({ params, session }) => {
  const mess = await requireMessOwner(session, params.id);
  const key = cacheKeys.messOrders(mess.id);
  const cached = await getJsonCache(key);
  if (cached !== null) return json(cached);

  const orders = await orderRepository.listForMess(mess.id);
  const payload = orders.length
    ? {
        orders: orders.map((o) => ({
          _id: o.id,
          consumer: o.consumer ? { _id: o.consumer.id, username: o.consumer.username, email: o.consumer.email } : null,
          noOfPlate: o.no_of_plate ?? 0,
          selectedDishName: o.selected_dish_name ?? null,
          selectedDishPrice: o.selected_dish_price ?? 0,
          totalPrice: o.total_price ?? 0,
          status: o.status ?? "",
          isTaken: !!o.is_taken,
          done: !!o.done,
          refundInitiated: !!o.refund_initiated,
          isCancelled: !!o.is_cancelled,
          createdAt: o.created_at ?? null,
        })),
        messOwnerId: mess.owner_id,
        messId: mess.id,
      }
    : { message: "No orders found for this Mess", orders: [], messOwnerId: mess.owner_id };

  await setJsonCache(key, payload, 120);
  return json(payload);
});

export const DELETE = createRoute({ name: "mess.orders.clear", auth: "owner", uuid: ["id"], bodyType: "none" }, async ({ params, session }) => {
  const mess = await requireMessOwner(session, params.id);
  const ids = await orderRepository.idsClearableForMess(mess.id);
  if (!ids.length) return json({ message: "No completed or failed orders to delete", deleted: 0 });
  await orderRepository.deleteMany(ids);
  await deleteCacheKeys([cacheKeys.messOrders(mess.id)]);
  return json({ message: "Deleted completed or failed orders", deleted: ids.length });
});

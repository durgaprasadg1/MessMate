import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { getJsonCache, setJsonCache, deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { notificationRepository } from "@/lib/server/repositories/notifications";

export const GET = createRoute({ name: "notifications.list", auth: "session" }, async ({ session }) => {
  const key = cacheKeys.notifications(session.user.id);
  const cached = await getJsonCache(key);
  if (cached !== null) return json(cached);

  const [notifications, unreadCount] = await Promise.all([
    notificationRepository.listFor(session.user.id),
    notificationRepository.unreadCount(session.user.id),
  ]);
  const payload = {
    notifications: notifications.map((n) => ({ ...n, _id: n.id, isRead: n.is_read, createdAt: n.created_at })),
    unreadCount,
  };
  await setJsonCache(key, payload, 120);
  return json(payload);
});

export const DELETE = createRoute({ name: "notifications.clear", auth: "session", bodyType: "none" }, async ({ session }) => {
  await notificationRepository.deleteAll(session.user.id);
  await deleteCacheKeys([cacheKeys.notifications(session.user.id)]);
  return json({ message: "All notifications cleared" });
});

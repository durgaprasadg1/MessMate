import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound } from "@/lib/server/errors/httpErrors";
import { notificationRepository } from "@/lib/server/repositories/notifications";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";

// The UPDATE itself is filtered by recipient, so a user can never touch someone else's notification.
export const PATCH = createRoute({ name: "notifications.read", auth: "session", uuid: ["id"], bodyType: "none" }, async ({ params, session }) => {
  const notification = await notificationRepository.markRead(params.id, session.user.id);
  if (!notification) throw notFound("Notification not found");
  await deleteCacheKeys([cacheKeys.notifications(session.user.id)]);
  return json({ notification: { ...notification, _id: notification.id, isRead: true } });
});

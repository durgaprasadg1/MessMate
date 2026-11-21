import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notificationRepository } from "@/lib/server/repositories/notifications";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";

export const PATCH = createRoute({ name: "notifications.read-all", auth: "session", bodyType: "none" }, async ({ session }) => {
  await notificationRepository.markAllRead(session.user.id);
  await deleteCacheKeys([cacheKeys.notifications(session.user.id)]);
  return json({ message: "All notifications marked as read" });
});

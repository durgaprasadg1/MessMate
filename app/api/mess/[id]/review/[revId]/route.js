import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound, forbidden } from "@/lib/server/errors/httpErrors";
import { messRepository, reviewRepository } from "@/lib/server/repositories/messes";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";

// The review's author or the owner of the reviewed mess may delete it.
export const DELETE = createRoute({ name: "mess.review.delete", auth: "session", uuid: ["id", "revId"], bodyType: "none" }, async ({ params, session }) => {
  const review = await reviewRepository.getById(params.revId);
  if (!review || review.mess_id !== params.id) throw notFound("Review not found");

  let allowed = review.author_id === session.user.id;
  if (!allowed) {
    const mess = await messRepository.getOwnership(params.id);
    allowed = Boolean(mess?.owner_id) && mess.owner_id === session.user.id;
  }
  if (!allowed) throw forbidden();

  const deleted = await reviewRepository.delete(review.id);
  if (!deleted) throw notFound("Review not found");
  await deleteCacheKeys([cacheKeys.mess(params.id), cacheKeys.messAnalytics(params.id)]);
  return json({ message: "Review Deleted Successfully" });
});

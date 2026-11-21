import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound } from "@/lib/server/errors/httpErrors";
import { reviewSchema } from "@/lib/server/validation/schemas";
import { messRepository, reviewRepository } from "@/lib/server/repositories/messes";
import { requireActiveConsumer } from "@/lib/server/auth/guards";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";

export const POST = createRoute({ name: "mess.review.create", auth: "consumer", uuid: ["id"], body: reviewSchema }, async ({ params, session, body }) => {
  await requireActiveConsumer(session, "Your account is blocked by admin due to your activities. You cannot post reviews");
  const mess = await messRepository.getOwnership(params.id);
  if (!mess) throw notFound("Mess not found");

  const review = await reviewRepository.create({ rating: body.rating, feedback: body.text, authorId: session.user.id, messId: mess.id });
  await deleteCacheKeys([cacheKeys.mess(mess.id), cacheKeys.messAnalytics(mess.id)]);
  return json({ message: " Review added successfully", review });
});

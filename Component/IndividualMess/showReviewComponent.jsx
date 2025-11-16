import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const ShowReviewComponent = ({ reviews = [], mess }) => {
  const router = useRouter();

  const deleteReview = async (revId) => {
    try {
      let res = await fetch(`/api/mess/${mess._id}/review/${revId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error("Error: " + err.message);
      } else {
        toast.success("Review deleted successfully");
        router.refresh();
        router.push(`/mess/${mess._id}`);
      }
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  };

  if (!Array.isArray(reviews) || reviews.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-xl shadow-sm text-center text-gray-600">
        No reviews yet for this mess.
      </div>
    );
  }
  

  return (
  <div className="bg-gray-50 p-6 rounded-2xl shadow-md mt-6">
    <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
      Customer Reviews
    </h2>

    {reviews.length === 0 ? (
      <p className="text-gray-500 text-center">No reviews yet.</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {reviews.map((rev, i) => {
          const rating = Math.max(0, Math.min(5, Number(rev?.rating) || 0));
          const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
          const dateStr = rev?.date
            ? new Date(rev.date).toLocaleDateString()
            : "Recently added";
          const feedback = rev?.feedback ?? "";
          const authorName = rev?.author?.username || "Anonymous";
          const key = rev?._id ?? i;

          return (
            <div
              key={key}
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="font-semibold text-base text-gray-800 truncate">
                    {authorName}
                  </h3>
                  <p className="text-xs text-gray-400">{dateStr}</p>
                </div>
                <div className="text-yellow-500 text-sm font-semibold">{stars}</div>
              </div>

              <p className="text-gray-700 text-sm leading-relaxed mb-3 line-clamp-4">
                {feedback || "No feedback provided."}
              </p>

              <div className="flex justify-end">
                <button
                  onClick={() => deleteReview(rev._id)}
                  className="bg-gray-600 hover:bg-black text-white px-3 py-1.5 rounded text-xs font-medium transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

    )}
  </div>
);

};

export default ShowReviewComponent;

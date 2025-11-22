"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import Loading from "../Others/Loading";
const ReviewSection = ({ messID }) => {
  const { data: session } = useSession();

  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error("Please Login");
      router.push("/login");
      return;
    }
    if (!rating || !reviewText.trim()) {
      const txt = "Please give both rating and review.";
      toast.error(txt);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/mess/${messID}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text: reviewText }),
      });

      const data = await res.json();

      if (res.ok) {
        const ok = "Review submitted successfully!";
        toast.success(ok);
        setReviewText("");
        setRating(0);
      } else {
        const errMsg = "Something went wrong, Review not submitted.";
        toast.error(errMsg);
      }
    } catch (error) {
      toast.error("Failed to submit review.");
    } finally {
      setLoading(false);
      router.refresh();
    }
  };
  if (loading) return <Loading />;

  return (
    <div className="w-full p-6 min-h-9 bg-gray-100 rounded-2xl shadow-md mt-6 ">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
        Share Your Experience
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className={`cursor-pointer text-3xl transition-colors duration-150 ${
                (hover || rating) >= star ? "text-yellow-400" : "text-gray-400"
              }`}
            >
              ★
            </span>
          ))}
        </div>

        {/* 📝 Review Text */}
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Write your review here..."
          rows="4"
          className="w-full border-2 border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-400"
        ></textarea>

        {/* 🔘 Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gray-600 text-white rounded font-semibold hover:bg-black transition-all"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>

      
    </div>
  );
};

export default ReviewSection;

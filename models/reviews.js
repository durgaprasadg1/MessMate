import mongoose from "mongoose";
const { Schema } = mongoose;

const reviewSchema = new Schema({
  feedback: {
    type: String,
    minLength: 3,
  },
  rating: {
    type: Number,
    default: 1,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "Consumer",
  },
  mess: {
    type: Schema.Types.ObjectId,
    ref: "Mess",
  },
});

reviewSchema.index({ author: 1 });
reviewSchema.index({ createdAt: -1 });

reviewSchema.post("findOneAndDelete", async (review) => {
  if (review) {
    // Review doesn't own child documents
  }
});

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
export default Review;

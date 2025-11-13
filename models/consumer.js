import mongoose from "mongoose";
const { Schema } = mongoose;
// let passportLocalMongoose;
// try {
//   passportLocalMongoose = require("passport-local-mongoose");
// } catch (e) {
//   // optional dependency — if it's not installed, skip plugin registration
//   passportLocalMongoose = null;
// }
import Mess from "./mess";
import Order from "./order";
import Review from "./reviews";

const consumerSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mess: [
    {
      type: Schema.Types.ObjectId,
      ref: "Mess",
    },
  ],
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  orders: [
    {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
  address: {
    type: String,
    required: true,
    min: 2,
  },

  phone: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: true,
  },
  verifyToken: String,

  verifyTokenExpiry: Date,

  resetToken: String,

  resetTokenExpiry: Date,
});

// if (passportLocalMongoose) {
//   consumerSchema.plugin(passportLocalMongoose);
// }

consumerSchema.post("findOneAndDelete", async (consumer) => {
  if (consumer) {
    await Mess.deleteMany({ _id: { $in: consumer.mess } });

    await Review.deleteMany({ _id: { $in: consumer.reviews } });

    await Order.deleteMany({ _id: { $in: consumer.orders } });
  }
});
consumerSchema.index({ phone: 1 });
consumerSchema.index({ isVerified: 1 });

const Consumer =
  mongoose.models.Consumer || mongoose.model("Consumer", consumerSchema);
export default Consumer;

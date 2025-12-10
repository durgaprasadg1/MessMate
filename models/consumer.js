import mongoose from "mongoose";
const { Schema } = mongoose;
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
  isBlocked: {
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

  haveMonthlyMess: {
    type: Boolean,
    default: false,
  },
});

consumerSchema.post("findOneAndDelete", async (consumer) => {
  if (consumer) {
    try {
      const MessModule = await import("./mess");
      const MessModel =
        MessModule && MessModule.default ? MessModule.default : MessModule;
      if (MessModel && MessModel.deleteMany) {
        await MessModel.deleteMany({ _id: { $in: consumer.mess } });
      }
    } catch (e) {
      console.error("Error deleting related Mess docs for consumer:", e);
    }

    try {
      const ReviewModule = await import("./reviews");
      const ReviewModel =
        ReviewModule && ReviewModule.default
          ? ReviewModule.default
          : ReviewModule;
      if (ReviewModel && ReviewModel.deleteMany) {
        await ReviewModel.deleteMany({ _id: { $in: consumer.reviews } });
      }
    } catch (e) {
      console.error("Error deleting related Review docs for consumer:", e);
    }

    try {
      const OrderModule = await import("./order");
      const OrderModel =
        OrderModule && OrderModule.default ? OrderModule.default : OrderModule;
      if (OrderModel && OrderModel.deleteMany) {
        await OrderModel.deleteMany({ _id: { $in: consumer.orders } });
      }
    } catch (e) {
      console.error("Error deleting related Order docs for consumer:", e);
    }
  }
});
consumerSchema.index({ phone: 1 });
consumerSchema.index({ isVerified: 1 });

const Consumer =
  mongoose.models.Consumer || mongoose.model("Consumer", consumerSchema);
export default Consumer;

import mongoose from "mongoose";
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    consumer: {
      type: Schema.Types.ObjectId,
      ref: "Consumer",
      required: true,
    },
    mess: {
      type: Schema.Types.ObjectId,
      ref: "Mess",
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },

    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },

    status: {
      type: String,
      enum: ["created", "pending", "paid", "failed", "refunded", "completed"],
      default: "created",
    },

    paymentVerified: {
      type: Boolean,
      default: false,
    },
    noOfPlate: {
      type: Number,
      default: 1,
    },
    selectedDishName: { type: String },
    selectedDishPrice: { type: Number, default: 0 },
    messName: { type: String },
    done: {
      type: Boolean,
      default: false,
    },
    isTaken: {
      type: Boolean,
      default: false,
    },
    notified: { type: Boolean, default: false },
    consumerSubscription: { type: Object },
    isCancelled: { type: Boolean, default: false },
    refundInitiated: { type: Boolean, default: false },
  },

  { timestamps: true }
);

orderSchema.index({ consumer: 1 });
orderSchema.index({ mess: 1 });
orderSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;

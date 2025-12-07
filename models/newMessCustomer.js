import mongoose from "mongoose";
const { Schema } = mongoose;

const newMessCustomerSchema = new Schema(
  {
    customer: [
      {
        type: Schema.Types.ObjectId,
        ref: "Consumer",
      },
    ],
    mess: {
      type: Schema.Types.ObjectId,
      ref: "Mess",
    },
    duration: {
      type: String,
      enum: ["Day", "Night", "Day + Night"],
      required: true,
    },

    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
    },

    paymentMode: {
      type: String,
      enum: ["upi", "cash"],
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    college: {
      type: String,
      trim: true,
    },

    joiningDate: {
      type: Date,
      default: Date.now(),
    },

    foodPreference: {
      type: String,
      enum: ["Veg", "Non-Veg", "Both"],
    },

    emergencyContact: {
      type: String,
      match: /^[0-9]{10}$/,
    },
    isAllowed: {
      type: Boolean,
      default: false,
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
    paymentVerified: {
      type: Boolean,
      default: false,
    },
    totalAmount: {
      type: Number,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "created", "paid", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const NewMessCustomer =
  mongoose.models.NewMessCustomer ||
  mongoose.model("NewMessCustomer", newMessCustomerSchema);

export default NewMessCustomer;

import mongoose from "mongoose";

const { Schema } = mongoose;

const ownerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      minLength: 3,
      required: true,
      unique: true,
    },
    upi: {
      type: String,
      minLength: 4,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
    },
    messes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Mess",
      },
    ],
    password: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Owner ||
  mongoose.model("Owner", ownerSchema);

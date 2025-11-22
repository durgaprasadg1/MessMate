import mongoose from "mongoose";
const { Schema } = mongoose;

const wastageSchema = new Schema(
  {
    mess: {
      type: Schema.Types.ObjectId,
      ref: "Mess",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    plateName: {
      type: String,
    },
    cookedQty: {
      type: Number,
      required: true,
    },
    servedQty: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

wastageSchema.index({ mess: 1, date: -1 });

const Wastage =
  mongoose.models.Wastage || mongoose.model("Wastage", wastageSchema);

export default Wastage;

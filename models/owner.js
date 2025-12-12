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

ownerSchema.post("findOneAndDelete", async (owner) => {
  if (owner) {
    try {
      const MessModule = await import("./mess");
      const MessModel =
        MessModule && MessModule.default ? MessModule.default : MessModule;
      if (MessModel && MessModel.deleteMany) {
        await MessModel.deleteMany({ _id: { $in: owner.messes } });
      }
    } catch (e) {
      console.error("Error deleting related Mess docs for owner:", e);
    }
  }
});

export default mongoose.models.Owner || mongoose.model("Owner", ownerSchema);

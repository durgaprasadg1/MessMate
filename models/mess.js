import mongoose from "mongoose";
import Review from "./reviews";
import Order from "./order";
import Consumer from "./consumer";
const Schema = mongoose.Schema;

const messSchema = Schema({
  name: {
    type: String,
    required: true,
    minLength: 3,
  },

  description: {
    type: String,
  },

  image: {
    url: {
      type: String,
    },
    filename: String,
  },

  address: {
    type: String,
  },

  mealTime: {
    type: String,
    default: "",
  },

  vegMenu: [
    {
      name: { type: String, default: "" },
      price: { type: Number, default: null },
      items: [
        {
          name: { type: String, default: "" },
          price: { type: Number, default: null },
          isLimited: { type: Boolean, default: false },
          limitCount: { type: Number, default: null },
        },
      ],
    },
  ],
  vegPrice: {
    type: Number,
  },
  nonVegPrice: {
    type: Number,
  },
  nonVegMenu: [
    {
      name: { type: String, default: "" },
      price: { type: Number, default: null },
      items: [
        {
          name: { type: String, default: "" },
          price: { type: Number, default: null },
          isLimited: { type: Boolean, default: false },
          limitCount: { type: Number, default: null },
        },
      ],
    },
  ],
  nonVegMenuRef: { type: Schema.Types.ObjectId, ref: "Menu", default: null },
  vegMenuRef: { type: Schema.Types.ObjectId, ref: "Menu", default: null },

  owner: {
    type: Schema.Types.ObjectId,
    ref: "Consumer",
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

  category: {
    type: String,
    required: true,
    minLength: 2,
  },
  isOpen: {
    type: Boolean,
    default: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  adharNumber: {
    type: String,
    required: true,
    match: /^\d{12}$/,
  },
  phoneNumber: {
    type: String,
    required: true,
    match: /^\d{10}$/,
  },
  lat: {
    type: Number,
    required: true,
    min: -90,
    max: 90,
  },
  lon: {
    type: Number,
    required: true,
    min: -180,
    max: 180,
  },
  isLimited: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

// on Delete Cascade

messSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    if (doc.reviews.length) {
      await Review.deleteMany({ _id: { $in: doc.reviews } });
    }

    if (doc.orders.length) {
      await Order.deleteMany({ _id: { $in: doc.orders } });
    }
    const Menu = require("./menu");
    try {
      const MenuModule = await import("./menu");
      const Menu =
        MenuModule && MenuModule.default ? MenuModule.default : MenuModule;
      await Menu.deleteMany({ mess: doc._id });
    } catch (e) {
      console.error("Error deleting related Menu docs:", e);
    }
    try {
      await Consumer.updateMany(
        { mess: doc._id },
        { $pull: { mess: doc._id } }
      );
    } catch (e) {
      console.error("Error removing mess references from consumers:", e);
    }
  }
});

messSchema.index({ owner: 1 });
messSchema.index({ category: 1, isOpen: 1 });
messSchema.index({ name: "text", description: "text", address: "text" });
messSchema.index({ lat: 1, lon: 1 });

const Mess = mongoose.models.Mess || mongoose.model("Mess", messSchema);

export default Mess;

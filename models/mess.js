import mongoose from "mongoose";
import Review from "./reviews";
import Order from "./order";
import cloudinary from "../lib/cloudinary";
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
    public_id: String,
  },
  email: {
    type: String,
    required: true,
    minLength: 3,
  },
  upi : {
    type: String,
    required: true,
    minLength: 5,
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
    ref: "Owner",
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
  certificate: {
    url: {
      type: String,
    },
    filename: String,
    public_id: String,
  },
  isBlocked :{
    type : Boolean ,
    default: false, 
  }, 
  alert : [
    {
      type : Schema.Types.ObjectId,
      ref : "Message",
    }
  ]


});


messSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    try {
      if (doc.image && doc.image.public_id) {
        await cloudinary.uploader.destroy(doc.image.public_id, {
          resource_type: "image",
        });
      }
    } catch (e) {
      console.error("Error deleting mess image from Cloudinary:", e);
    }

    try {
      if (doc.certificate && doc.certificate.public_id) {
        await cloudinary.uploader.destroy(doc.certificate.public_id, {
          resource_type: "image",
        });
      }
    } catch (e) {
      console.error("Error deleting mess certificate from Cloudinary:", e);
    }

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
      const ConsumerModule = await import("./consumer");
      const ConsumerModel = ConsumerModule && ConsumerModule.default ? ConsumerModule.default : ConsumerModule;
      if (ConsumerModel && ConsumerModel.updateMany) {
        await ConsumerModel.updateMany({ mess: doc._id }, { $pull: { mess: doc._id } });
      }
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

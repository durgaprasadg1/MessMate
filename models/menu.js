import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  name: { type: String, default: "" },
  price: { type: Number, default: null },
  isLimited: { type: Boolean, default: false },
  limitCount: { type: Number, default: null },
});

const dishSchema = new Schema({
  name: { type: String, default: "" },
  price: { type: Number, default: null },
  items: [itemSchema],
});

const menuSchema = new Schema({
  mess: {
    type: Schema.Types.ObjectId,
    ref: "Mess",
    required: true,
    index: true,
  },
  menutype: { type: String, enum: ["vegMenu", "nonVegMenu"], required: true },
  mealTime: { type: String, default: "" },
  dishes: [dishSchema],
  createdAt: { type: Date, default: Date.now },
});
menuSchema.index({ mess: 1, menutype: 1 }, { unique: true });

const Menu = mongoose.models.Menu || mongoose.model("Menu", menuSchema);
export default Menu;

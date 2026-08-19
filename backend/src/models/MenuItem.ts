import { Schema, model, Types } from "mongoose";

const optionSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const menuItemSchema = new Schema(
  {
    restaurantId: {
      type: Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    image: { type: String, default: "" },
    menuSection: {
      type: String,
      default: "mains",
      trim: true,
    },
    isFeatured: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    options: { type: [optionSchema], default: [] },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurantId: 1, menuSection: 1 });

export const MenuItem = model("MenuItem", menuItemSchema);

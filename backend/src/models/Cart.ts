import { Schema, model, Types } from "mongoose";

const cartItemSchema = new Schema(
  {
    menuItemId: { type: Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    options: [{ type: String }],
    note: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    restaurantId: { type: Types.ObjectId, ref: "Restaurant" },
    restaurantName: { type: String, default: "" },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

export const Cart = model("Cart", cartSchema);

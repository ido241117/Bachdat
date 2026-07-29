import { Schema, model, Types } from "mongoose";

const orderItemSchema = new Schema(
  {
    menuItemId: { type: Types.ObjectId, ref: "MenuItem" },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    options: [{ type: String }],
    note: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const deliveryAddressSchema = new Schema(
  {
    label: { type: String, required: true },
    fullAddress: { type: String, required: true },
    note: { type: String, default: "" },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const trackingStepSchema = new Schema(
  {
    key: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "delivering", "completed", "cancelled"],
      required: true,
    },
    label: { type: String, required: true },
    done: { type: Boolean, default: false },
    at: { type: Date },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    restaurantId: {
      type: Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    restaurantName: { type: String, default: "" },
    restaurantImage: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "delivering", "completed", "cancelled"],
      default: "pending",
    },
    items: { type: [orderItemSchema], required: true },
    deliveryAddress: { type: deliveryAddressSchema, required: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "momo", "zalopay", "card"],
      default: "cash",
    },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    voucherCode: { type: String },
    voucherId: { type: Types.ObjectId, ref: "Voucher" },
    note: { type: String, default: "" },
    deliveredAt: { type: Date },
    trackingSteps: { type: [trackingStepSchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const Order = model("Order", orderSchema);

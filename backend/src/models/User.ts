import { Schema, model, Types } from "mongoose";

const addressSchema = new Schema(
  {
    label: { type: String, required: true },
    fullAddress: { type: String, required: true },
    note: { type: String, default: "" },
    lat: { type: Number },
    lng: { type: Number },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const paymentMethodSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["cash", "momo", "zalopay", "card"],
      required: true,
    },
    label: { type: String, required: true },
    last4: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    name: { type: String, default: "Người dùng QuickBite" },
    avatar: { type: String, default: "" },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold", "diamond"],
      default: "bronze",
    },
    points: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    addresses: { type: [addressSchema], default: [] },
    paymentMethods: { type: [paymentMethodSchema], default: [] },
    notificationSettings: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
    },
    savedVoucherIds: [{ type: Types.ObjectId, ref: "Voucher" }],
  },
  { timestamps: true }
);

export const User = model("User", userSchema);

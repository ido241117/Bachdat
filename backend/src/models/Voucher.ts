import { Schema, model, Types } from "mongoose";

const voucherSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    type: {
      type: String,
      enum: ["freeship", "discount_fixed", "discount_percent", "cashback"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    value: { type: Number, required: true },
    maxDiscount: { type: Number },
    minOrderAmount: { type: Number, default: 0 },
    applicableTo: {
      type: String,
      enum: ["all", "category", "restaurant"],
      default: "all",
    },
    applicableId: { type: Types.ObjectId },
    totalLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    filterTag: {
      type: String,
      enum: ["freeship", "discount", "payment"],
      default: "discount",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Voucher = model("Voucher", voucherSchema);

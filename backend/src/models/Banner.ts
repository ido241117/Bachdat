import { Schema, model, Types } from "mongoose";

const bannerSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    tag: { type: String, default: "" },
    image: { type: String, default: "" },
    linkType: {
      type: String,
      enum: ["restaurant", "voucher", "deeplink", "none"],
      default: "none",
    },
    linkId: { type: Types.ObjectId },
    screen: { type: String, enum: ["home", "rewards"], default: "home" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export const Banner = model("Banner", bannerSchema);

import { Schema, model, Types } from "mongoose";

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    coverImage: { type: String, default: "" },
    tags: [{ type: String }],
    categoryIds: [{ type: Types.ObjectId, ref: "Category" }],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    priceLevel: { type: String, enum: ["$", "$$", "$$$"], default: "$" },
    deliveryTimeMin: { type: Number, default: 20 },
    deliveryTimeMax: { type: Number, default: 30 },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [105.788, 10.045] }, // [lng, lat] Cần Thơ
    },
    address: { type: String, default: "" },
    district: { type: String, default: "Ninh Kiều" },
    city: { type: String, default: "Cần Thơ" },
    hasFreeShip: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    isOpen: { type: Boolean, default: true },
    openingHours: { type: String, default: "08:00 - 22:00" },
  },
  { timestamps: true }
);

restaurantSchema.index({ location: "2dsphere" });
restaurantSchema.index({ categoryIds: 1 });
restaurantSchema.index({ name: "text", tags: "text" });

export const Restaurant = model("Restaurant", restaurantSchema);

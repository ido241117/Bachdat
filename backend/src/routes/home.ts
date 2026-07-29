import { Router } from "express";
import { Banner, Category, Restaurant } from "../models";
import { haversineKm } from "../utils/helpers";
import { optionalAuth } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, async (req, res) => {
  const lat = Number(req.query.lat) || 10.7769;
  const lng = Number(req.query.lng) || 106.7009;

  const [banners, categories, restaurants] = await Promise.all([
    Banner.find({
      screen: "home",
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }, { expiresAt: { $exists: false } }],
    })
      .sort({ sortOrder: 1 })
      .limit(10),
    Category.find({ isActive: true }).sort({ sortOrder: 1 }),
    Restaurant.find({ isOpen: true }).sort({ isPopular: -1, rating: -1 }).limit(20),
  ]);

  const restaurantsWithDistance = restaurants.map((r) => {
    const [rLng, rLat] = r.location?.coordinates || [106.7009, 10.7769];
    return {
      ...r.toObject(),
      distanceKm: haversineKm(lng, lat, rLng, rLat),
    };
  });

  res.json({
    banners,
    categories,
    restaurants: restaurantsWithDistance,
  });
});

export default router;

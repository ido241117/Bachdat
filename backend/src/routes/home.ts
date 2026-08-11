import { Router } from "express";
import { Banner, Category, Restaurant } from "../models";
import { haversineKm } from "../utils/helpers";
import { optionalAuth } from "../middleware/auth";

const router = Router();

/** Mặc định: Ninh Kiều, Cần Thơ */
const DEFAULT_LAT = 10.045;
const DEFAULT_LNG = 105.788;

router.get("/", optionalAuth, async (req, res) => {
  const hasCoords =
    req.query.lat != null &&
    req.query.lng != null &&
    !Number.isNaN(Number(req.query.lat)) &&
    !Number.isNaN(Number(req.query.lng));
  const lat = hasCoords ? Number(req.query.lat) : DEFAULT_LAT;
  const lng = hasCoords ? Number(req.query.lng) : DEFAULT_LNG;

  const [banners, categories, restaurants] = await Promise.all([
    Banner.find({
      screen: "home",
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
        { expiresAt: { $exists: false } },
      ],
    })
      .sort({ sortOrder: 1 })
      .limit(10),
    Category.find({ isActive: true }).sort({ sortOrder: 1 }),
    Restaurant.find({ isOpen: true }).limit(80),
  ]);

  const restaurantsWithDistance = restaurants
    .map((r) => {
      const [rLng, rLat] = r.location?.coordinates || [DEFAULT_LNG, DEFAULT_LAT];
      return {
        ...r.toObject(),
        distanceKm: haversineKm(lng, lat, rLng, rLat),
      };
    })
    .sort((a, b) => {
      if (hasCoords) return a.distanceKm - b.distanceKm;
      return (
        Number(!!b.isPopular) - Number(!!a.isPopular) ||
        (b.rating || 0) - (a.rating || 0) ||
        a.distanceKm - b.distanceKm
      );
    })
    .slice(0, 30);

  res.json({
    banners,
    categories,
    restaurants: restaurantsWithDistance,
    origin: { lat, lng, fromClient: hasCoords },
  });
});

export default router;

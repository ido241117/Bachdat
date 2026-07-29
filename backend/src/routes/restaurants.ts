import { Router } from "express";
import { Types } from "mongoose";
import { Restaurant, MenuItem, Category } from "../models";
import { haversineKm } from "../utils/helpers";

const router = Router();

router.get("/", async (req, res) => {
  const {
    search = "",
    category,
    lat = "10.7769",
    lng = "106.7009",
    popular,
  } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = { isOpen: true };

  if (search) {
    filter.$text = { $search: search };
  }
  if (category) {
    if (Types.ObjectId.isValid(category)) {
      filter.categoryIds = new Types.ObjectId(category);
    } else {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.categoryIds = cat._id;
    }
  }
  if (popular === "true") {
    filter.isPopular = true;
  }

  const restaurants = await Restaurant.find(filter)
    .sort({ isPopular: -1, rating: -1 })
    .limit(50);

  const userLat = Number(lat);
  const userLng = Number(lng);

  res.json(
    restaurants.map((r) => {
      const [rLng, rLat] = r.location?.coordinates || [106.7009, 10.7769];
      return {
        ...r.toObject(),
        distanceKm: haversineKm(userLng, userLat, rLng, rLat),
      };
    })
  );
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const lat = Number(req.query.lat) || 10.7769;
  const lng = Number(req.query.lng) || 106.7009;

  const filter = Types.ObjectId.isValid(id)
    ? { _id: id }
    : { slug: id };

  const restaurant = await Restaurant.findOne(filter).populate("categoryIds");
  if (!restaurant) {
    return res.status(404).json({ error: "Không tìm thấy quán" });
  }

  const [rLng, rLat] = restaurant.location?.coordinates || [106.7009, 10.7769];
  res.json({
    ...restaurant.toObject(),
    distanceKm: haversineKm(lng, lat, rLng, rLat),
  });
});

router.get("/:id/menu", async (req, res) => {
  const { id } = req.params;
  const restaurant = Types.ObjectId.isValid(id)
    ? await Restaurant.findById(id)
    : await Restaurant.findOne({ slug: id });

  if (!restaurant) {
    return res.status(404).json({ error: "Không tìm thấy quán" });
  }

  const items = await MenuItem.find({
    restaurantId: restaurant._id,
    isAvailable: true,
  }).sort({ menuSection: 1, sortOrder: 1 });

  const sections = ["featured", "mains", "drinks", "desserts"] as const;
  const grouped = Object.fromEntries(
    sections.map((s) => [s, items.filter((i) => i.menuSection === s)])
  );

  res.json({
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    sections: grouped,
    items,
  });
});

export default router;

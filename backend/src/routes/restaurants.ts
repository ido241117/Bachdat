import { Router } from "express";
import { Types } from "mongoose";
import { Restaurant, MenuItem, Category, Review, Order } from "../models";
import { haversineKm, recomputeRestaurantRating } from "../utils/helpers";
import { requireAuth, AuthRequest } from "../middleware/auth";

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

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.get("/search", async (req, res) => {
  const {
    q = "",
    lat = "10.7769",
    lng = "106.7009",
    minPrice,
    maxPrice,
  } = req.query as Record<string, string>;

  const query = q.trim();
  if (!query) {
    return res.json({ query, restaurants: [], dishes: [] });
  }

  const userLat = Number(lat);
  const userLng = Number(lng);
  const re = new RegExp(escapeRegex(query), "i");

  const dishFilter: Record<string, unknown> = { isAvailable: true, name: re };
  const min = Number(minPrice);
  const max = Number(maxPrice);
  if (Number.isFinite(min) || Number.isFinite(max)) {
    dishFilter.price = {
      ...(Number.isFinite(min) ? { $gte: min } : {}),
      ...(Number.isFinite(max) ? { $lte: max } : {}),
    };
  }

  const [restaurants, dishes] = await Promise.all([
    Restaurant.find({
      isOpen: true,
      $or: [{ name: re }, { tags: re }],
    })
      .sort({ isPopular: -1, rating: -1 })
      .limit(20),
    MenuItem.find(dishFilter)
      .populate({ path: "restaurantId", match: { isOpen: true } })
      .sort({ sortOrder: 1 })
      .limit(30),
  ]);

  res.json({
    query,
    restaurants: restaurants.map((r) => {
      const [rLng, rLat] = r.location?.coordinates || [106.7009, 10.7769];
      return {
        ...r.toObject(),
        distanceKm: haversineKm(userLng, userLat, rLng, rLat),
      };
    }),
    dishes: dishes
      .filter((d) => d.restaurantId)
      .map((d) => {
        const restaurant = d.restaurantId as any;
        const [rLng, rLat] = restaurant.location?.coordinates || [106.7009, 10.7769];
        return {
          _id: d._id,
          name: d.name,
          description: d.description,
          price: d.price,
          originalPrice: d.originalPrice,
          image: d.image,
          restaurant: {
            ...restaurant.toObject(),
            distanceKm: haversineKm(userLng, userLat, rLng, rLat),
          },
        };
      }),
  });
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

router.get("/:id/reviews", async (req, res) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

  const [reviews, total] = await Promise.all([
    Review.find({ restaurantId: id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments({ restaurantId: id }),
  ]);

  res.json({ reviews, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

router.post("/:id/reviews", requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  const { orderId, rating, comment } = req.body as {
    orderId?: string;
    rating?: number;
    comment?: string;
  };

  if (!orderId || !Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ error: "Thiếu orderId" });
  }
  const ratingNum = Number(rating);
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: "Rating phải từ 1 đến 5" });
  }

  const order = await Order.findOne({ _id: orderId, userId: req.userId });
  if (!order) {
    return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
  }
  if (String(order.restaurantId) !== id) {
    return res.status(400).json({ error: "Đơn hàng không thuộc quán này" });
  }
  if (order.status !== "completed") {
    return res.status(400).json({ error: "Chỉ có thể đánh giá đơn đã hoàn thành" });
  }
  if (order.reviewed) {
    return res.status(400).json({ error: "Đơn hàng này đã được đánh giá" });
  }

  const user = req.user!;
  let review;
  try {
    review = await Review.create({
      userId: req.userId,
      userName: user.name,
      userAvatar: user.avatar,
      restaurantId: id,
      orderId,
      rating: ratingNum,
      comment: (comment || "").trim().slice(0, 1000),
    });
  } catch {
    return res.status(400).json({ error: "Đơn hàng này đã được đánh giá" });
  }

  order.reviewed = true;
  await order.save();
  await recomputeRestaurantRating(id);

  res.status(201).json(review);
});

export default router;

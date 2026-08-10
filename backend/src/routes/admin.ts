import { Router, Response } from "express";
import { Types } from "mongoose";
import { requireAdmin, type AuthRequest } from "../middleware/auth";
import {
  User,
  Restaurant,
  MenuItem,
  Order,
  Category,
} from "../models";
import { slugify } from "../utils/helpers";

const router = Router();
router.use(requireAdmin);

router.get("/me", (req: AuthRequest, res: Response) => {
  const u = req.user!;
  res.json({
    id: u.id,
    phone: u.phone,
    name: u.name,
    role: u.role,
  });
});

/** Tổng quan doanh thu + số liệu */
router.get("/stats", async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const completedFilter = { status: "completed" as const };

  const [
    revenueAll,
    revenueToday,
    revenueMonth,
    orderCounts,
    restaurantCount,
    userCount,
    menuCount,
    recentOrders,
    topRestaurants,
  ] = await Promise.all([
    Order.aggregate([
      { $match: completedFilter },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { ...completedFilter, updatedAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { ...completedFilter, updatedAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Restaurant.countDocuments(),
    User.countDocuments({ role: { $ne: "admin" } }),
    MenuItem.countDocuments(),
    Order.find().sort({ createdAt: -1 }).limit(8).lean(),
    Order.aggregate([
      { $match: completedFilter },
      {
        $group: {
          _id: "$restaurantId",
          name: { $first: "$restaurantName" },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const byStatus: Record<string, number> = {};
  for (const row of orderCounts) {
    byStatus[row._id] = row.count;
  }

  res.json({
    revenue: {
      all: revenueAll[0]?.total || 0,
      today: revenueToday[0]?.total || 0,
      month: revenueMonth[0]?.total || 0,
      completedOrders: revenueAll[0]?.count || 0,
      completedToday: revenueToday[0]?.count || 0,
      completedMonth: revenueMonth[0]?.count || 0,
    },
    counts: {
      restaurants: restaurantCount,
      users: userCount,
      menuItems: menuCount,
      ordersByStatus: byStatus,
    },
    recentOrders,
    topRestaurants,
  });
});

// ——— Categories (read for forms) ———
router.get("/categories", async (_req, res) => {
  const list = await Category.find().sort({ sortOrder: 1 }).lean();
  res.json(list);
});

// ——— Restaurants ———
router.get("/restaurants", async (_req, res) => {
  const list = await Restaurant.find().sort({ createdAt: -1 }).lean();
  const withMenuCount = await Promise.all(
    list.map(async (r) => ({
      ...r,
      menuCount: await MenuItem.countDocuments({ restaurantId: r._id }),
    })),
  );
  res.json(withMenuCount);
});

router.post("/restaurants", async (req: AuthRequest, res: Response) => {
  const body = req.body || {};
  if (!body.name?.trim()) {
    return res.status(400).json({ error: "Thiếu tên quán" });
  }
  const baseSlug = slugify(body.name) || `quan-${Date.now()}`;
  let slug = baseSlug;
  let i = 1;
  while (await Restaurant.findOne({ slug })) {
    slug = `${baseSlug}-${i++}`;
  }

  const lng = Number(body.lng ?? body.location?.coordinates?.[0] ?? 105.788);
  const lat = Number(body.lat ?? body.location?.coordinates?.[1] ?? 10.045);

  const restaurant = await Restaurant.create({
    name: body.name.trim(),
    slug,
    coverImage: body.coverImage || "",
    tags: body.tags || [],
    categoryIds: body.categoryIds || [],
    rating: body.rating ?? 0,
    reviewCount: body.reviewCount ?? 0,
    priceLevel: body.priceLevel || "$",
    deliveryTimeMin: body.deliveryTimeMin ?? 20,
    deliveryTimeMax: body.deliveryTimeMax ?? 30,
    location: { type: "Point", coordinates: [lng, lat] },
    address: body.address || "",
    district: body.district || "",
    city: body.city || "Cần Thơ",
    hasFreeShip: Boolean(body.hasFreeShip),
    isPopular: Boolean(body.isPopular),
    isOpen: body.isOpen !== false,
    openingHours: body.openingHours || "08:00 - 22:00",
  });

  res.status(201).json(restaurant);
});

router.patch("/restaurants/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }
  const body = { ...req.body };
  if (body.lng != null || body.lat != null) {
    const existing = await Restaurant.findById(id);
    const coords = existing?.location?.coordinates || [105.788, 10.045];
    body.location = {
      type: "Point",
      coordinates: [
        Number(body.lng ?? coords[0]),
        Number(body.lat ?? coords[1]),
      ],
    };
    delete body.lng;
    delete body.lat;
  }
  delete body.slug;
  delete body._id;

  const updated = await Restaurant.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ error: "Không tìm thấy quán" });
  res.json(updated);
});

router.delete("/restaurants/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }
  const deleted = await Restaurant.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Không tìm thấy quán" });
  await MenuItem.deleteMany({ restaurantId: id });
  res.json({ ok: true });
});

// ——— Menu ———
router.get("/restaurants/:id/menu", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }
  const items = await MenuItem.find({ restaurantId: id })
    .sort({ menuSection: 1, sortOrder: 1 })
    .lean();
  res.json(items);
});

router.post("/restaurants/:id/menu", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) return res.status(404).json({ error: "Không tìm thấy quán" });

  const body = req.body || {};
  if (!body.name?.trim() || body.price == null) {
    return res.status(400).json({ error: "Thiếu tên hoặc giá món" });
  }

  const item = await MenuItem.create({
    restaurantId: id,
    name: body.name.trim(),
    description: body.description || "",
    price: Number(body.price),
    image: body.image || "",
    menuSection: body.menuSection || "mains",
    isFeatured: Boolean(body.isFeatured),
    isAvailable: body.isAvailable !== false,
    options: body.options || [],
    sortOrder: body.sortOrder ?? 0,
  });
  res.status(201).json(item);
});

router.patch("/menu/:itemId", async (req: AuthRequest, res: Response) => {
  const { itemId } = req.params;
  if (!Types.ObjectId.isValid(itemId)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }
  const body = { ...req.body };
  delete body._id;
  delete body.restaurantId;
  const updated = await MenuItem.findByIdAndUpdate(itemId, body, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ error: "Không tìm thấy món" });
  res.json(updated);
});

router.delete("/menu/:itemId", async (req: AuthRequest, res: Response) => {
  const { itemId } = req.params;
  if (!Types.ObjectId.isValid(itemId)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }
  const deleted = await MenuItem.findByIdAndDelete(itemId);
  if (!deleted) return res.status(404).json({ error: "Không tìm thấy món" });
  res.json({ ok: true });
});

// ——— Orders ———
router.get("/orders", async (req: AuthRequest, res: Response) => {
  const { status, limit = "50" } = req.query;
  const filter: Record<string, unknown> = {};
  if (typeof status === "string" && status && status !== "all") {
    filter.status = status;
  }
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 200))
    .lean();
  res.json(orders);
});

router.patch("/orders/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }
  const { status } = req.body || {};
  const allowed = [
    "pending",
    "confirmed",
    "preparing",
    "delivering",
    "completed",
    "cancelled",
  ];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Trạng thái không hợp lệ" });
  }

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ error: "Không tìm thấy đơn" });

  order.status = status;
  if (Array.isArray(order.trackingSteps)) {
    const idx = order.trackingSteps.findIndex((s) => s.key === status);
    order.trackingSteps.forEach((s, i) => {
      if (idx >= 0 && i <= idx) {
        s.done = true;
        if (!s.at) s.at = new Date();
      }
    });
  }
  if (status === "completed") order.deliveredAt = new Date();
  await order.save();
  res.json(order);
});

// ——— Users ———
router.get("/users", async (_req, res) => {
  const users = await User.find()
    .select("phone name tier points role createdAt")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json(users);
});

router.patch("/users/:id/role", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body || {};
  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ error: "role phải là user|admin" });
  }
  if (id === req.userId && role !== "admin") {
    return res.status(400).json({ error: "Không thể tự bỏ quyền admin" });
  }
  const updated = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true },
  ).select("phone name tier points role createdAt");
  if (!updated) return res.status(404).json({ error: "Không tìm thấy user" });
  res.json(updated);
});

export default router;

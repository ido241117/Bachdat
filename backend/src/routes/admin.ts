import { Router, Response } from "express";
import { Types } from "mongoose";
import { requireAdmin, type AuthRequest } from "../middleware/auth";
import {
  User,
  Restaurant,
  MenuItem,
  Order,
  Category,
  Voucher,
  Banner,
  Review,
} from "../models";
import { slugify, recomputeRestaurantRating } from "../utils/helpers";

const router = Router();
router.use(requireAdmin);

function oid(id: string) {
  return Types.ObjectId.isValid(id);
}

router.get("/me", (req: AuthRequest, res: Response) => {
  const u = req.user!;
  res.json({
    id: u.id,
    phone: u.phone,
    name: u.name,
    role: u.role,
  });
});

router.get("/stats", async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const start7 = new Date(startOfDay);
  start7.setDate(start7.getDate() - 6);

  const completedFilter = { status: "completed" as const };

  const [
    revenueAll,
    revenueToday,
    revenueMonth,
    orderCounts,
    restaurantCount,
    userCount,
    menuCount,
    voucherCount,
    bannerCount,
    recentOrders,
    topRestaurants,
    revenueByDay,
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
    Voucher.countDocuments(),
    Banner.countDocuments(),
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
    Order.aggregate([
      {
        $match: {
          ...completedFilter,
          updatedAt: { $gte: start7 },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const byStatus: Record<string, number> = {};
  for (const row of orderCounts) byStatus[row._id] = row.count;

  const dayMap = new Map(
    revenueByDay.map((d: { _id: string; revenue: number; orders: number }) => [
      d._id,
      d,
    ]),
  );
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start7);
    d.setDate(start7.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const hit = dayMap.get(key);
    return {
      date: key,
      revenue: hit?.revenue || 0,
      orders: hit?.orders || 0,
    };
  });

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
      vouchers: voucherCount,
      banners: bannerCount,
      ordersByStatus: byStatus,
    },
    recentOrders,
    topRestaurants,
    last7Days,
  });
});

// ——— Categories ———
router.get("/categories", async (_req, res) => {
  const list = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  res.json(list);
});

router.post("/categories", async (req: AuthRequest, res: Response) => {
  const body = req.body || {};
  if (!body.name?.trim()) {
    return res.status(400).json({ error: "Thiếu tên danh mục" });
  }
  const base = slugify(body.name) || `cat-${Date.now()}`;
  let slug = body.slug?.trim() || base;
  let i = 1;
  while (await Category.findOne({ slug })) slug = `${base}-${i++}`;

  const cat = await Category.create({
    name: body.name.trim(),
    slug,
    icon: body.icon || "restaurant",
    sortOrder: Number(body.sortOrder ?? 0),
    isActive: body.isActive !== false,
  });
  res.status(201).json(cat);
});

router.patch("/categories/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!oid(id)) return res.status(400).json({ error: "ID không hợp lệ" });
  const body = { ...req.body };
  delete body._id;
  const updated = await Category.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ error: "Không tìm thấy" });
  res.json(updated);
});

router.delete("/categories/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!oid(id)) return res.status(400).json({ error: "ID không hợp lệ" });
  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Không tìm thấy" });
  res.json({ ok: true });
});

// ——— Restaurants ———
router.get("/restaurants", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { address: new RegExp(q, "i") },
      { district: new RegExp(q, "i") },
      { city: new RegExp(q, "i") },
    ];
  }
  const list = await Restaurant.find(filter).sort({ createdAt: -1 }).lean();
  const withMenuCount = await Promise.all(
    list.map(async (r) => ({
      ...r,
      menuCount: await MenuItem.countDocuments({ restaurantId: r._id }),
    })),
  );
  res.json(withMenuCount);
});

router.get("/restaurants/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!oid(id)) return res.status(400).json({ error: "ID không hợp lệ" });
  const restaurant = await Restaurant.findById(id).lean();
  if (!restaurant) return res.status(404).json({ error: "Không tìm thấy quán" });
  const menuCount = await MenuItem.countDocuments({ restaurantId: id });
  res.json({ ...restaurant, menuCount });
});

router.post("/restaurants", async (req: AuthRequest, res: Response) => {
  const body = req.body || {};
  if (!body.name?.trim()) {
    return res.status(400).json({ error: "Thiếu tên quán" });
  }
  const baseSlug = slugify(body.name) || `quan-${Date.now()}`;
  let slug = baseSlug;
  let i = 1;
  while (await Restaurant.findOne({ slug })) slug = `${baseSlug}-${i++}`;

  const lng = Number(body.lng ?? body.location?.coordinates?.[0] ?? 105.788);
  const lat = Number(body.lat ?? body.location?.coordinates?.[1] ?? 10.045);
  const tags = Array.isArray(body.tags)
    ? body.tags
    : typeof body.tags === "string"
      ? body.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [];

  const restaurant = await Restaurant.create({
    name: body.name.trim(),
    slug,
    coverImage: body.coverImage || "",
    tags,
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
  if (!oid(id)) return res.status(400).json({ error: "ID không hợp lệ" });
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
  if (typeof body.tags === "string") {
    body.tags = body.tags
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean);
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
  if (!oid(id)) return res.status(400).json({ error: "ID không hợp lệ" });
  const deleted = await Restaurant.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Không tìm thấy quán" });
  await MenuItem.deleteMany({ restaurantId: id });
  res.json({ ok: true });
});

// ——— Menu ———
router.get("/restaurants/:id/menu", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!oid(id)) return res.status(400).json({ error: "ID không hợp lệ" });
  const items = await MenuItem.find({ restaurantId: id })
    .sort({ menuSection: 1, sortOrder: 1 })
    .lean();
  res.json(items);
});

router.get("/menu/:itemId", async (req: AuthRequest, res: Response) => {
  const { itemId } = req.params;
  if (!oid(itemId)) return res.status(400).json({ error: "ID không hợp lệ" });
  const item = await MenuItem.findById(itemId).lean();
  if (!item) return res.status(404).json({ error: "Không tìm thấy món" });
  res.json(item);
});

router.post("/restaurants/:id/menu", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!oid(id)) return res.status(400).json({ error: "ID không hợp lệ" });
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
  if (!oid(itemId)) return res.status(400).json({ error: "ID không hợp lệ" });
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
  if (!oid(itemId)) return res.status(400).json({ error: "ID không hợp lệ" });
  const deleted = await MenuItem.findByIdAndDelete(itemId);
  if (!deleted) return res.status(404).json({ error: "Không tìm thấy món" });
  res.json({ ok: true });
});

// ——— Orders ———
router.get("/orders", async (req: AuthRequest, res: Response) => {
  const { status, limit = "50", q } = req.query;
  const filter: Record<string, unknown> = {};
  if (typeof status === "string" && status && status !== "all") {
    filter.status = status;
  }
  if (typeof q === "string" && q.trim()) {
    filter.$or = [
      { restaurantName: new RegExp(q.trim(), "i") },
      { "deliveryAddress.fullAddress": new RegExp(q.trim(), "i") },
      { voucherCode: new RegExp(q.trim(), "i") },
    ];
  }
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 200))
    .lean();
  res.json(orders);
});

router.get("/orders/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!oid(id)) return res.status(400).json({ error: "ID không hợp lệ" });
  const order = await Order.findById(id).lean();
  if (!order) return res.status(404).json({ error: "Không tìm thấy đơn" });
  const user = order.userId
    ? await User.findById(order.userId).select("name phone").lean()
    : null;
  res.json({ ...order, user });
});

router.patch("/orders/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!oid(id)) return res.status(400).json({ error: "ID không hợp lệ" });
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

// ——— Vouchers ———
router.get("/vouchers", async (_req, res) => {
  const list = await Voucher.find().sort({ createdAt: -1 }).lean();
  res.json(list);
});

router.post("/vouchers", async (req: AuthRequest, res: Response) => {
  const body = req.body || {};
  if (!body.code?.trim() || !body.title?.trim() || !body.type) {
    return res.status(400).json({ error: "Thiếu code / title / type" });
  }
  try {
    const voucher = await Voucher.create({
      code: String(body.code).trim().toUpperCase(),
      type: body.type,
      title: body.title.trim(),
      description: body.description || "",
      value: Number(body.value ?? 0),
      maxDiscount: body.maxDiscount != null ? Number(body.maxDiscount) : undefined,
      minOrderAmount: Number(body.minOrderAmount ?? 0),
      applicableTo: body.applicableTo || "all",
      applicableId: body.applicableId || undefined,
      totalLimit: body.totalLimit != null ? Number(body.totalLimit) : undefined,
      usedCount: Number(body.usedCount ?? 0),
      startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      filterTag: body.filterTag || "discount",
      isActive: body.isActive !== false,
    });
    res.status(201).json(voucher);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Tạo voucher thất bại";
    res.status(400).json({ error: msg });
  }
});

router.patch("/vouchers/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!oid(id)) return res.status(400).json({ error: "ID không hợp lệ" });
  const body = { ...req.body };
  if (body.code) body.code = String(body.code).trim().toUpperCase();
  if (body.expiresAt) body.expiresAt = new Date(body.expiresAt);
  if (body.startsAt) body.startsAt = new Date(body.startsAt);
  delete body._id;
  try {
    const updated = await Voucher.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Không tìm thấy" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Cập nhật thất bại",
    });
  }
});

router.delete("/vouchers/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!oid(id)) return res.status(400).json({ error: "ID không hợp lệ" });
  const deleted = await Voucher.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Không tìm thấy" });
  res.json({ ok: true });
});

// ——— Banners ———
router.get("/banners", async (_req, res) => {
  const list = await Banner.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  res.json(list);
});

router.post("/banners", async (req: AuthRequest, res: Response) => {
  const body = req.body || {};
  if (!body.title?.trim()) {
    return res.status(400).json({ error: "Thiếu tiêu đề banner" });
  }
  const banner = await Banner.create({
    title: body.title.trim(),
    subtitle: body.subtitle || "",
    tag: body.tag || "",
    image: body.image || "",
    linkType: body.linkType || "none",
    linkId: body.linkId || undefined,
    screen: body.screen || "home",
    sortOrder: Number(body.sortOrder ?? 0),
    isActive: body.isActive !== false,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
  });
  res.status(201).json(banner);
});

router.patch("/banners/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!oid(id)) return res.status(400).json({ error: "ID không hợp lệ" });
  const body = { ...req.body };
  if (body.expiresAt) body.expiresAt = new Date(body.expiresAt);
  delete body._id;
  const updated = await Banner.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ error: "Không tìm thấy" });
  res.json(updated);
});

router.delete("/banners/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!oid(id)) return res.status(400).json({ error: "ID không hợp lệ" });
  const deleted = await Banner.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Không tìm thấy" });
  res.json({ ok: true });
});

// ——— Reviews (kiểm duyệt) ———
router.get("/reviews", async (req, res) => {
  const { restaurantId, limit = "50" } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (restaurantId && oid(restaurantId)) filter.restaurantId = restaurantId;
  const list = await Review.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 200))
    .lean();
  res.json(list);
});

router.delete("/reviews/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!oid(id)) return res.status(400).json({ error: "ID không hợp lệ" });
  const deleted = await Review.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Không tìm thấy" });
  await Order.findByIdAndUpdate(deleted.orderId, { reviewed: false });
  await recomputeRestaurantRating(deleted.restaurantId);
  res.json({ ok: true });
});

// ——— Users ———
router.get("/users", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { phone: new RegExp(q, "i") },
      { name: new RegExp(q, "i") },
    ];
  }
  const users = await User.find(filter)
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

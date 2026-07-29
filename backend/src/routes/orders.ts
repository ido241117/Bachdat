import { Router } from "express";
import { Types } from "mongoose";
import { Order, Restaurant, MenuItem, Voucher, Cart, User } from "../models";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { defaultTrackingSteps } from "../utils/helpers";

const router = Router();

const ACTIVE = ["pending", "confirmed", "preparing", "delivering"];
const HISTORY = ["completed", "cancelled"];

function calcVoucherDiscount(
  voucher: InstanceType<typeof Voucher>,
  subtotal: number,
  deliveryFee: number
) {
  switch (voucher.type) {
    case "freeship":
      return Math.min(deliveryFee, voucher.value);
    case "discount_fixed":
      return Math.min(subtotal, voucher.value);
    case "discount_percent": {
      const raw = Math.round((subtotal * voucher.value) / 100);
      return voucher.maxDiscount ? Math.min(raw, voucher.maxDiscount) : raw;
    }
    case "cashback":
      return 0; // cashback sau khi hoàn thành
    default:
      return 0;
  }
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const status = (req.query.status as string) || "active";
  const filter: Record<string, unknown> = { userId: req.userId };

  if (status === "active") filter.status = { $in: ACTIVE };
  else if (status === "history") filter.status = { $in: HISTORY };
  else if (status) filter.status = status;

  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(50);
  res.json(orders);
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!order) return res.status(404).json({ error: "Không tìm thấy đơn" });
  res.json(order);
});

router.get("/:id/tracking", requireAuth, async (req: AuthRequest, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!order) return res.status(404).json({ error: "Không tìm thấy đơn" });
  res.json({
    orderId: order.id,
    status: order.status,
    trackingSteps: order.trackingSteps,
  });
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const {
    restaurantId,
    items,
    deliveryAddress,
    paymentMethod = "cash",
    voucherCode,
    note = "",
    deliveryFee = 15000,
  } = req.body;

  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Thiếu restaurantId hoặc items" });
  }
  if (!deliveryAddress?.fullAddress) {
    return res.status(400).json({ error: "Thiếu địa chỉ giao hàng" });
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({ error: "Không tìm thấy quán" });
  }

  const menuIds = items
    .map((i: { menuItemId: string }) => i.menuItemId)
    .filter((id: string) => Types.ObjectId.isValid(id));
  const menuItems = await MenuItem.find({
    _id: { $in: menuIds },
    restaurantId,
  });
  const menuMap = new Map(menuItems.map((m) => [m.id, m]));

  const orderItems = items.map(
    (i: {
      menuItemId: string;
      quantity: number;
      options?: string[];
      note?: string;
      name?: string;
      price?: number;
      image?: string;
    }) => {
      const menu = menuMap.get(i.menuItemId);
      return {
        menuItemId: i.menuItemId,
        name: menu?.name || i.name || "Món",
        price: menu?.price ?? i.price ?? 0,
        quantity: i.quantity || 1,
        options: i.options || [],
        note: i.note || "",
        image: menu?.image || i.image || "",
      };
    }
  );

  const subtotal = orderItems.reduce(
    (sum: number, i: { price: number; quantity: number }) =>
      sum + i.price * i.quantity,
    0
  );

  let discount = 0;
  let voucherId: Types.ObjectId | undefined;
  let appliedCode: string | undefined;

  if (voucherCode) {
    const voucher = await Voucher.findOne({
      code: voucherCode.toUpperCase(),
      isActive: true,
    });
    if (!voucher) {
      return res.status(400).json({ error: "Mã voucher không hợp lệ" });
    }
    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      return res.status(400).json({ error: "Voucher đã hết hạn" });
    }
    if (subtotal < voucher.minOrderAmount) {
      return res.status(400).json({
        error: `Đơn tối thiểu ${voucher.minOrderAmount.toLocaleString("vi-VN")}đ`,
      });
    }
    if (voucher.totalLimit && voucher.usedCount >= voucher.totalLimit) {
      return res.status(400).json({ error: "Voucher đã hết lượt" });
    }
    discount = calcVoucherDiscount(voucher, subtotal, deliveryFee);
    voucherId = voucher._id;
    appliedCode = voucher.code;
    voucher.usedCount += 1;
    await voucher.save();
  }

  const fee = restaurant.hasFreeShip ? 0 : deliveryFee;
  const total = Math.max(0, subtotal + fee - discount);

  const order = await Order.create({
    userId: req.userId,
    restaurantId: restaurant._id,
    restaurantName: restaurant.name,
    restaurantImage: restaurant.coverImage,
    status: "pending",
    items: orderItems,
    deliveryAddress,
    paymentMethod,
    subtotal,
    deliveryFee: fee,
    discount,
    total,
    voucherCode: appliedCode,
    voucherId,
    note,
    trackingSteps: defaultTrackingSteps("pending"),
  });

  // cộng điểm thưởng (~1% đơn)
  const pointsEarned = Math.floor(total / 1000);
  if (pointsEarned > 0) {
    await User.findByIdAndUpdate(req.userId, { $inc: { points: pointsEarned } });
  }

  await Cart.findOneAndDelete({ userId: req.userId });

  res.status(201).json({ order, pointsEarned });
});

router.post("/:id/cancel", requireAuth, async (req: AuthRequest, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!order) return res.status(404).json({ error: "Không tìm thấy đơn" });
  if (!["pending", "confirmed"].includes(order.status)) {
    return res.status(400).json({ error: "Không thể hủy đơn ở trạng thái này" });
  }
  order.status = "cancelled";
  order.trackingSteps = [
    ...order.trackingSteps.filter((s) => s.key !== "cancelled"),
    { key: "cancelled", label: "Đã hủy", done: true, at: new Date() },
  ];
  await order.save();
  res.json(order);
});

router.post("/:id/reorder", requireAuth, async (req: AuthRequest, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!order) return res.status(404).json({ error: "Không tìm thấy đơn" });

  const cart = await Cart.findOneAndUpdate(
    { userId: req.userId },
    {
      userId: req.userId,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurantName,
      items: order.items.map((i) => ({
        menuItemId: i.menuItemId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        options: i.options,
        note: i.note,
        image: i.image,
      })),
    },
    { upsert: true, new: true }
  );

  res.json({ cart, message: "Đã thêm vào giỏ" });
});

export default router;

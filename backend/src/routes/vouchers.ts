import { Router } from "express";
import { Voucher } from "../models";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

function calcDiscount(
  voucher: InstanceType<typeof Voucher>,
  subtotal: number,
  deliveryFee: number,
) {
  if (voucher.type === "freeship") {
    return Math.min(deliveryFee, voucher.value);
  }
  if (voucher.type === "discount_fixed") {
    return Math.min(subtotal, voucher.value);
  }
  if (voucher.type === "discount_percent") {
    const raw = Math.round((subtotal * voucher.value) / 100);
    return voucher.maxDiscount ? Math.min(raw, voucher.maxDiscount) : raw;
  }
  // cashback: không trừ tiền đơn ngay
  return 0;
}

router.get("/", async (req, res) => {
  const filterTag = req.query.filter as string | undefined;
  const query: Record<string, unknown> = {
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
      { expiresAt: { $exists: false } },
    ],
  };
  if (filterTag) query.filterTag = filterTag;

  const vouchers = await Voucher.find(query).sort({ expiresAt: 1 });
  res.json(
    vouchers.map((v) => ({
      ...v.toObject(),
      almostGone: v.totalLimit
        ? v.usedCount / v.totalLimit >= 0.8
        : false,
    })),
  );
});

/**
 * Luôn HTTP 200 — client đọc valid/error để hiện lý do,
 * tránh Nuốt lỗi khi 400 khiến discount = 0 im lặng.
 */
router.post("/validate", requireAuth, async (req: AuthRequest, res) => {
  const { code, subtotal = 0, deliveryFee = 15000 } = req.body as {
    code?: string;
    subtotal?: number;
    deliveryFee?: number;
  };

  if (!code?.trim()) {
    return res.json({
      valid: false,
      discount: 0,
      error: "Thiếu mã voucher",
    });
  }

  const voucher = await Voucher.findOne({
    code: code.trim().toUpperCase(),
    isActive: true,
  });

  if (!voucher) {
    return res.json({
      valid: false,
      discount: 0,
      error: "Mã không hợp lệ",
    });
  }
  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    return res.json({
      valid: false,
      discount: 0,
      error: "Voucher đã hết hạn",
    });
  }
  if (voucher.totalLimit && voucher.usedCount >= voucher.totalLimit) {
    return res.json({
      valid: false,
      discount: 0,
      error: "Voucher đã hết lượt",
    });
  }
  if (subtotal < (voucher.minOrderAmount || 0)) {
    return res.json({
      valid: false,
      discount: 0,
      error: `Đơn tối thiểu ${(voucher.minOrderAmount || 0).toLocaleString("vi-VN")}đ`,
      minOrderAmount: voucher.minOrderAmount,
    });
  }
  if (voucher.type === "cashback") {
    return res.json({
      valid: false,
      discount: 0,
      error: "Mã cashback không trừ tiền đơn (hoàn điểm/tiền sau)",
      voucher,
    });
  }
  if (voucher.type === "freeship" && deliveryFee <= 0) {
    return res.json({
      valid: false,
      discount: 0,
      error: "Đơn không phát sinh phí ship",
      voucher,
    });
  }

  const discount = calcDiscount(voucher, Number(subtotal) || 0, Number(deliveryFee) || 0);
  if (discount <= 0) {
    return res.json({
      valid: false,
      discount: 0,
      error: "Mã không áp dụng được cho đơn này",
      voucher,
    });
  }

  res.json({
    valid: true,
    voucher: {
      _id: voucher.id,
      code: voucher.code,
      type: voucher.type,
      title: voucher.title,
      description: voucher.description,
      value: voucher.value,
      minOrderAmount: voucher.minOrderAmount,
    },
    discount,
    message: `Giảm ${discount.toLocaleString("vi-VN")}đ`,
  });
});

router.post("/:id/save", requireAuth, async (req: AuthRequest, res) => {
  const voucher = await Voucher.findById(req.params.id);
  if (!voucher) return res.status(404).json({ error: "Không tìm thấy voucher" });

  const user = req.user!;
  const already = user.savedVoucherIds.some(
    (id) => id.toString() === voucher.id,
  );
  if (!already) {
    user.savedVoucherIds.push(voucher._id);
    await user.save();
  }
  res.json({ ok: true, savedVoucherIds: user.savedVoucherIds });
});

export default router;

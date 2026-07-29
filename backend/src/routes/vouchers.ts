import { Router } from "express";
import { Voucher } from "../models";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", async (req, res) => {
  const filterTag = req.query.filter as string | undefined;
  const query: Record<string, unknown> = {
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }, { expiresAt: { $exists: false } }],
  };
  if (filterTag) query.filterTag = filterTag;

  const vouchers = await Voucher.find(query).sort({ expiresAt: 1 });
  res.json(
    vouchers.map((v) => ({
      ...v.toObject(),
      almostGone: v.totalLimit
        ? v.usedCount / v.totalLimit >= 0.8
        : false,
    }))
  );
});

router.post("/validate", requireAuth, async (req: AuthRequest, res) => {
  const { code, subtotal = 0, deliveryFee = 15000 } = req.body as {
    code?: string;
    subtotal?: number;
    deliveryFee?: number;
  };

  if (!code) return res.status(400).json({ error: "Thiếu mã voucher" });

  const voucher = await Voucher.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!voucher) {
    return res.status(400).json({ valid: false, error: "Mã không hợp lệ" });
  }
  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    return res.status(400).json({ valid: false, error: "Voucher đã hết hạn" });
  }
  if (subtotal < voucher.minOrderAmount) {
    return res.status(400).json({
      valid: false,
      error: `Đơn tối thiểu ${voucher.minOrderAmount.toLocaleString("vi-VN")}đ`,
    });
  }
  if (voucher.totalLimit && voucher.usedCount >= voucher.totalLimit) {
    return res.status(400).json({ valid: false, error: "Voucher đã hết lượt" });
  }

  let discount = 0;
  if (voucher.type === "freeship") {
    discount = Math.min(deliveryFee, voucher.value);
  } else if (voucher.type === "discount_fixed") {
    discount = Math.min(subtotal, voucher.value);
  } else if (voucher.type === "discount_percent") {
    const raw = Math.round((subtotal * voucher.value) / 100);
    discount = voucher.maxDiscount ? Math.min(raw, voucher.maxDiscount) : raw;
  }

  res.json({
    valid: true,
    voucher,
    discount,
    message: `Giảm ${discount.toLocaleString("vi-VN")}đ`,
  });
});

router.post("/:id/save", requireAuth, async (req: AuthRequest, res) => {
  const voucher = await Voucher.findById(req.params.id);
  if (!voucher) return res.status(404).json({ error: "Không tìm thấy voucher" });

  const user = req.user!;
  const already = user.savedVoucherIds.some(
    (id) => id.toString() === voucher.id
  );
  if (!already) {
    user.savedVoucherIds.push(voucher._id);
    await user.save();
  }
  res.json({ ok: true, savedVoucherIds: user.savedVoucherIds });
});

export default router;

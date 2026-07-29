import { Router } from "express";
import { User, Voucher } from "../models";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!;
  res.json({
    id: user.id,
    phone: user.phone,
    name: user.name,
    avatar: user.avatar,
    tier: user.tier,
    points: user.points,
    referralCode: user.referralCode,
    notificationSettings: user.notificationSettings,
    addresses: user.addresses,
    paymentMethods: user.paymentMethods,
    savedVoucherIds: user.savedVoucherIds,
  });
});

router.patch("/me", requireAuth, async (req: AuthRequest, res) => {
  const { name, avatar, notificationSettings } = req.body;
  const user = req.user!;

  if (typeof name === "string") user.name = name;
  if (typeof avatar === "string") user.avatar = avatar;
  if (notificationSettings && typeof notificationSettings === "object") {
    user.notificationSettings = {
      ...user.notificationSettings,
      ...notificationSettings,
    };
  }
  await user.save();
  res.json({
    id: user.id,
    phone: user.phone,
    name: user.name,
    avatar: user.avatar,
    tier: user.tier,
    points: user.points,
    notificationSettings: user.notificationSettings,
  });
});

router.get("/me/addresses", requireAuth, async (req: AuthRequest, res) => {
  res.json(req.user!.addresses);
});

router.post("/me/addresses", requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!;
  const { label, fullAddress, note, lat, lng, isDefault } = req.body;

  if (!label || !fullAddress) {
    return res.status(400).json({ error: "Thiếu label hoặc fullAddress" });
  }

  if (isDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
  }

  user.addresses.push({
    label,
    fullAddress,
    note: note || "",
    lat,
    lng,
    isDefault: Boolean(isDefault) || user.addresses.length === 0,
  });
  await user.save();
  res.status(201).json(user.addresses[user.addresses.length - 1]);
});

router.patch("/me/addresses/:id", requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!;
  const addr = user.addresses.find((a) => a._id.toString() === req.params.id);
  if (!addr) return res.status(404).json({ error: "Không tìm thấy địa chỉ" });

  const { label, fullAddress, note, lat, lng, isDefault } = req.body;
  if (label !== undefined) addr.label = label;
  if (fullAddress !== undefined) addr.fullAddress = fullAddress;
  if (note !== undefined) addr.note = note;
  if (lat !== undefined) addr.lat = lat;
  if (lng !== undefined) addr.lng = lng;
  if (isDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
    addr.isDefault = true;
  }
  await user.save();
  res.json(addr);
});

router.delete("/me/addresses/:id", requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!;
  const exists = user.addresses.some((a) => a._id.toString() === req.params.id);
  if (!exists) return res.status(404).json({ error: "Không tìm thấy địa chỉ" });
  await User.findByIdAndUpdate(user._id, {
    $pull: { addresses: { _id: req.params.id } },
  });
  res.json({ ok: true });
});

router.get("/me/payment-methods", requireAuth, async (req: AuthRequest, res) => {
  res.json(req.user!.paymentMethods);
});

router.get("/me/vouchers", requireAuth, async (req: AuthRequest, res) => {
  const ids = req.user!.savedVoucherIds;
  const vouchers = await Voucher.find({
    _id: { $in: ids },
    isActive: true,
  });
  res.json(vouchers);
});

export default router;

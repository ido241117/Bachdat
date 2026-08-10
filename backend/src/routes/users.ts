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
  const user = req.user!;
  const norm = (s: string) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const near = (a: { lat?: number; lng?: number }, b: { lat?: number; lng?: number }) => {
    if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return false;
    const dLat = (a.lat - b.lat) * 111_320;
    const dLng = (a.lng - b.lng) * 111_320 * Math.cos((b.lat * Math.PI) / 180);
    return Math.hypot(dLat, dLng) < 40;
  };

  // Dedupe list đã lưu sẵn (giữ bản đầu / default ưu tiên)
  const unique: typeof user.addresses = [];
  const dropIds: string[] = [];
  const sorted = [...user.addresses].sort(
    (a, b) => Number(!!b.isDefault) - Number(!!a.isDefault),
  );
  for (const addr of sorted) {
    const dup = unique.find(
      (u) =>
        norm(u.fullAddress) === norm(addr.fullAddress) || near(u, addr),
    );
    if (dup) {
      dropIds.push(String(addr._id));
    } else {
      unique.push(addr);
    }
  }

  if (dropIds.length) {
    user.addresses = user.addresses.filter(
      (a) => !dropIds.includes(String(a._id)),
    );
    await user.save();
  }

  res.json(user.addresses);
});

router.post("/me/addresses", requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!;
  const { label, fullAddress, note, lat, lng, isDefault } = req.body;

  if (!label || !fullAddress) {
    return res.status(400).json({ error: "Thiếu label hoặc fullAddress" });
  }

  const norm = (s: string) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const nearMeters = (aLat?: number, aLng?: number, bLat?: number, bLng?: number) => {
    if (
      aLat == null ||
      aLng == null ||
      bLat == null ||
      bLng == null ||
      Number.isNaN(aLat) ||
      Number.isNaN(aLng) ||
      Number.isNaN(bLat) ||
      Number.isNaN(bLng)
    ) {
      return Number.POSITIVE_INFINITY;
    }
    const dLat = (aLat - bLat) * 111_320;
    const dLng = (aLng - bLng) * 111_320 * Math.cos((bLat * Math.PI) / 180);
    return Math.hypot(dLat, dLng);
  };

  // Trùng nếu cùng fullAddress (normalize) hoặc khoảng cách < 40m
  const existing = user.addresses.find((a) => {
    if (norm(a.fullAddress) === norm(fullAddress)) return true;
    return nearMeters(a.lat, a.lng, Number(lat), Number(lng)) < 40;
  });

  if (existing) {
    if (label) existing.label = label;
    existing.fullAddress = fullAddress;
    if (note !== undefined) existing.note = note || "";
    if (lat !== undefined) existing.lat = lat;
    if (lng !== undefined) existing.lng = lng;
    if (isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
      existing.isDefault = true;
    }
    await user.save();
    return res.json(existing);
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

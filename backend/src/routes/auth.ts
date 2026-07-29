import { Router } from "express";
import { User } from "../models";
import { env } from "../config/env";
import { signToken } from "../utils/jwt";
import { requireAuth } from "../middleware/auth";

const router = Router();

function genReferralCode(phone: string) {
  return `QB${phone.slice(-4)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Dev OTP login — body: { phone, otp } */
router.post("/login", async (req, res) => {
  const { phone, otp } = req.body as { phone?: string; otp?: string };

  if (!phone || !/^\d{9,11}$/.test(phone)) {
    return res.status(400).json({ error: "Số điện thoại không hợp lệ" });
  }
  if (otp !== env.devOtp) {
    return res.status(400).json({ error: "OTP không đúng" });
  }

  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({
      phone,
      name: `User ${phone.slice(-4)}`,
      referralCode: genReferralCode(phone),
      points: 1250,
      tier: "silver",
      addresses: [
        {
          label: "Căn hộ B12, Tòa nhà Sky",
          fullAddress: "123 Đường Lê Lợi, Quận 1, TP.HCM",
          note: "Để ở sảnh lễ tân",
          lat: 10.7769,
          lng: 106.7009,
          isDefault: true,
        },
      ],
      paymentMethods: [
        { type: "momo", label: "MoMo", isDefault: true },
        { type: "cash", label: "Tiền mặt", isDefault: false },
      ],
    });
  }

  const token = signToken({ userId: user.id, phone: user.phone });
  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      avatar: user.avatar,
      tier: user.tier,
      points: user.points,
      referralCode: user.referralCode,
    },
  });
});

router.post("/logout", requireAuth, (_req, res) => {
  res.json({ ok: true });
});

/** Helper để mobile gọi lấy OTP (dev only) */
router.post("/otp", (req, res) => {
  const { phone } = req.body as { phone?: string };
  if (!phone) return res.status(400).json({ error: "Thiếu phone" });
  res.json({
    message: "OTP đã gửi (dev mode)",
    otp: env.devOtp,
    expiresIn: 300,
  });
});

export default router;

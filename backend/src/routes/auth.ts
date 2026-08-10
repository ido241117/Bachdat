import { Router } from "express";
import { User } from "../models";
import { env } from "../config/env";
import { signToken } from "../utils/jwt";
import { requireAuth } from "../middleware/auth";

const router = Router();

function genReferralCode(phone: string) {
  return `QB${phone.slice(-4)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Dev OTP login/register — body: { phone, otp, name? } */
router.post("/login", async (req, res) => {
  const { phone, otp, name } = req.body as {
    phone?: string;
    otp?: string;
    name?: string;
  };

  if (!phone || !/^\d{9,11}$/.test(phone)) {
    return res.status(400).json({ error: "Số điện thoại không hợp lệ" });
  }
  if (otp !== env.devOtp) {
    return res.status(400).json({ error: "OTP không đúng" });
  }

  let user = await User.findOne({ phone });
  if (!user) {
    const trimmedName = name?.trim();
    if (!trimmedName) {
      // New phone number — tell the client to collect a name before creating the account.
      return res.json({ needsName: true });
    }
    if (trimmedName.length < 2) {
      return res.status(400).json({ error: "Tên phải có ít nhất 2 ký tự" });
    }
    user = await User.create({
      phone,
      name: trimmedName,
      referralCode: genReferralCode(phone),
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
      role: user.role || "user",
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

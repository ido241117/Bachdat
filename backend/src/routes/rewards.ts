import { Router } from "express";
import { Banner } from "../models";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { walletProgress, MISSIONS } from "../utils/helpers";

const router = Router();

router.get("/wallet", requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!;
  const progress = walletProgress(user.points, user.tier);

  const banners = await Banner.find({
    screen: "rewards",
    isActive: true,
  }).sort({ sortOrder: 1 });

  res.json({
    ...progress,
    referralCode: user.referralCode,
    banners,
  });
});

router.get("/missions", (_req, res) => {
  res.json(MISSIONS);
});

export default router;

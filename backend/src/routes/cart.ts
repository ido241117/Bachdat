import { Router } from "express";
import { Cart } from "../models";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const cart = await Cart.findOne({ userId: req.userId });
  res.json(
    cart || {
      userId: req.userId,
      restaurantId: null,
      restaurantName: "",
      items: [],
    }
  );
});

router.put("/", requireAuth, async (req: AuthRequest, res) => {
  const { restaurantId, restaurantName, items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "items phải là mảng" });
  }

  const cart = await Cart.findOneAndUpdate(
    { userId: req.userId },
    {
      userId: req.userId,
      restaurantId: restaurantId || null,
      restaurantName: restaurantName || "",
      items,
    },
    { upsert: true, new: true }
  );

  res.json(cart);
});

router.delete("/", requireAuth, async (req: AuthRequest, res) => {
  await Cart.findOneAndDelete({ userId: req.userId });
  res.json({ ok: true });
});

export default router;

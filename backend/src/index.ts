import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { errorHandler } from "./middleware/auth";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import homeRoutes from "./routes/home";
import restaurantRoutes from "./routes/restaurants";
import cartRoutes from "./routes/cart";
import orderRoutes from "./routes/orders";
import voucherRoutes from "./routes/vouchers";
import rewardRoutes from "./routes/rewards";
import adminRoutes from "./routes/admin";

async function main() {
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      service: "mealnow-api",
      status: "ok",
      health: "/health",
      docs: "See backend/API.md",
    });
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "mealnow-api",
    });
  });

  app.use("/auth", authRoutes);
  app.use("/users", userRoutes);
  app.use("/home", homeRoutes);
  app.use("/restaurants", restaurantRoutes);
  app.use("/cart", cartRoutes);
  app.use("/orders", orderRoutes);
  app.use("/vouchers", voucherRoutes);
  app.use("/rewards", rewardRoutes);
  app.use("/admin", adminRoutes);

  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`Mealnow API → http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});

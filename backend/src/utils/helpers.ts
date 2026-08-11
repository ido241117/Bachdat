import { Types } from "mongoose";
import { Review, Restaurant } from "../models";

export async function recomputeRestaurantRating(
  restaurantId: string | Types.ObjectId
) {
  const [agg] = await Review.aggregate([
    { $match: { restaurantId: new Types.ObjectId(restaurantId) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Restaurant.findByIdAndUpdate(restaurantId, {
    rating: agg ? Math.round(agg.avg * 10) / 10 : 0,
    reviewCount: agg ? agg.count : 0,
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function haversineKm(
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export function defaultTrackingSteps(status = "pending") {
  const steps = [
    { key: "pending", label: "Đã đặt đơn" },
    { key: "confirmed", label: "Quán xác nhận" },
    { key: "preparing", label: "Đang chuẩn bị" },
    { key: "delivering", label: "Đang giao" },
    { key: "completed", label: "Hoàn thành" },
  ] as const;

  const order = ["pending", "confirmed", "preparing", "delivering", "completed"];
  const idx = order.indexOf(status);

  return steps.map((s, i) => ({
    ...s,
    done: idx >= 0 && i <= idx,
    at: idx >= 0 && i <= idx ? new Date() : undefined,
  }));
}

const TIER_THRESHOLDS = [
  { tier: "bronze", min: 0, next: 500, label: "Đồng" },
  { tier: "silver", min: 500, next: 1500, label: "Bạc" },
  { tier: "gold", min: 1500, next: 3000, label: "Vàng" },
  { tier: "diamond", min: 3000, next: null, label: "Kim cương" },
] as const;

export function walletProgress(points: number, tier: string) {
  const current =
    TIER_THRESHOLDS.find((t) => t.tier === tier) || TIER_THRESHOLDS[0];
  const nextPts = current.next;
  const progress = nextPts
    ? Math.min(100, Math.round(((points - current.min) / (nextPts - current.min)) * 100))
    : 100;

  return {
    tier: current.tier,
    tierLabel: current.label,
    points,
    nextTier: nextPts
      ? TIER_THRESHOLDS[TIER_THRESHOLDS.findIndex((t) => t.tier === tier) + 1]?.tier
      : null,
    pointsToNext: nextPts ? Math.max(0, nextPts - points) : 0,
    progress,
  };
}

export const MISSIONS = [
  {
    id: "order-3",
    title: "Đặt 3 đơn trong tuần",
    description: "Hoàn thành 3 đơn để nhận 100 điểm",
    points: 100,
    target: 3,
  },
  {
    id: "invite-friend",
    title: "Mời bạn bè",
    description: "Bạn bè đặt đơn đầu tiên — nhận 200 điểm",
    points: 200,
    target: 1,
  },
  {
    id: "review-1",
    title: "Đánh giá quán",
    description: "Viết 1 đánh giá để nhận 50 điểm",
    points: 50,
    target: 1,
  },
];

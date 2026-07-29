export const formatPrice = (n: number) =>
  n.toLocaleString('vi-VN') + 'đ';

export const formatDistance = (km: number) =>
  `${Number(km).toFixed(1)} km`;

export const formatDelivery = (min: number, max: number) =>
  `${min}-${max} phút`;

export const formatReviews = (n: number) =>
  n >= 1000 ? `${Math.floor(n / 1000)}k+` : String(n);

export const formatOrderDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (sameDay) return `Hôm nay, ${time}`;
  return (
    d.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) + `, ${time}`
  );
};

const TIER_LABELS: Record<string, string> = {
  bronze: 'Đồng',
  silver: 'Bạc',
  gold: 'Vàng',
  diamond: 'Kim Cương',
};

export const formatTierLabel = (tier: string, label?: string) =>
  `Thành viên ${label || TIER_LABELS[tier] || tier}`;

export const formatNextTier = (tier: string) =>
  TIER_LABELS[tier] || tier;

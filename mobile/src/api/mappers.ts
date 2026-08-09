import { Restaurant, MenuItem } from '../data/restaurants';
import { Order, OrderStatus } from '../data/orders';
import { Voucher, PromoBanner, Mission } from '../data/vouchers';
import {
  formatDelivery,
  formatDistance,
  formatOrderDate,
  formatReviews,
} from './format';
import type {
  ApiBanner,
  ApiCategory,
  ApiMenuItem,
  ApiMission,
  ApiOrder,
  ApiOrderStatus,
  ApiRestaurant,
  ApiVoucher,
} from './types';

const CATEGORY_ICON_MAP: Record<string, string> = {
  rice_bowl: 'rice',
  bubble_tea: 'cup',
  ramen_dining: 'noodles',
  fastfood: 'food',
  bakery: 'bread',
  pizza: 'pizza',
  sushi: 'fish',
  chicken: 'drumstick',
  coffee: 'coffee',
};

export function mapCategory(c: ApiCategory) {
  return {
    id: c._id,
    name: c.name,
    slug: c.slug,
    icon: CATEGORY_ICON_MAP[c.icon] || 'food',
  };
}

export function mapMenuItem(item: ApiMenuItem): MenuItem {
  const layout =
    item.menuSection === 'featured'
      ? 'card'
      : item.menuSection === 'drinks' || item.menuSection === 'desserts'
        ? 'grid'
        : 'list';

  return {
    id: item._id,
    name: item.name,
    price: item.price,
    description: item.description,
    image: item.image,
    category: item.menuSection,
    layout,
  };
}

export function mapRestaurant(
  r: ApiRestaurant,
  menu: MenuItem[] = [],
): Restaurant {
  return {
    id: r._id,
    name: r.name,
    image: r.coverImage,
    heroImage: r.coverImage,
    rating: r.rating,
    reviewCount: formatReviews(r.reviewCount),
    deliveryTime: formatDelivery(r.deliveryTimeMin, r.deliveryTimeMax),
    distance: formatDistance(r.distanceKm ?? 0),
    tags: r.tags || [],
    priceLevel: r.priceLevel,
    cuisine: (r.tags || []).join(', '),
    freeship: r.hasFreeShip,
    popular: r.isPopular,
    menu,
  };
}

function mapUiOrderStatus(status: ApiOrderStatus): OrderStatus {
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'delivering';
}

export function mapOrder(o: ApiOrder & { restaurantId?: string }): Order {
  return {
    id: o._id,
    restaurantName: o.restaurantName,
    date: formatOrderDate(o.createdAt),
    items: o.items
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(', '),
    total: o.total,
    status: mapUiOrderStatus(o.status),
    image: o.restaurantImage,
    apiStatus: o.status,
    restaurantId: o.restaurantId,
  };
}

export function mapBanner(b: ApiBanner): PromoBanner {
  return {
    id: b._id,
    title: b.title,
    image: b.image,
  };
}

export function mapVoucher(v: ApiVoucher, saved = false): Voucher {
  const badgeType =
    v.filterTag === 'freeship'
      ? 'freeship'
      : v.filterTag === 'payment'
        ? 'ewallet'
        : 'discount';

  const badge =
    badgeType === 'freeship'
      ? 'Freeship'
      : badgeType === 'ewallet'
        ? 'E-Wallet'
        : 'Giảm giá';

  let expiry = 'Còn hạn';
  let expiryType: Voucher['expiryType'] = 'normal';
  if (v.almostGone) {
    expiry = 'Sắp hết lượt';
    expiryType = 'urgent';
  } else if (v.expiresAt) {
    const d = new Date(v.expiresAt);
    expiry = `Hết hạn: ${d.toLocaleDateString('vi-VN')}`;
    expiryType = 'date';
  }

  const discountAmount =
    v.type === 'discount_fixed'
      ? `-${Math.round(v.value / 1000)}k`
      : v.type === 'discount_percent'
        ? `-${v.value}%`
        : undefined;

  return {
    id: v._id,
    title: v.title,
    subtitle: v.description || `Mã ${v.code}`,
    badge,
    badgeType,
    expiry,
    expiryType,
    action: saved ? 'Đã Lưu' : 'Lưu',
    discountAmount,
  };
}

export function mapMission(m: ApiMission, index: number): Mission {
  const icon =
    m.id.includes('invite') || m.id.includes('share')
      ? 'share'
      : m.id.includes('review')
        ? 'star'
        : 'food';

  return {
    id: m.id,
    title: m.title,
    subtitle: m.description,
    points: m.points ? `+${m.points}` : '',
    icon,
    wide: index === 0,
  };
}

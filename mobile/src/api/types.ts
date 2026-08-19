export type ApiRestaurant = {
  _id: string;
  name: string;
  slug: string;
  coverImage: string;
  tags: string[];
  categoryIds?: string[];
  rating: number;
  reviewCount: number;
  priceLevel: string;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  hasFreeShip?: boolean;
  isPopular?: boolean;
  distanceKm?: number;
};

export type ApiCategory = {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
};

export type ApiBanner = {
  _id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  image: string;
  linkType?: string;
  linkId?: string;
  screen?: string;
};

export type ApiMenuItem = {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  menuSection: string;
  sortOrder?: number;
  options?: { name: string; price: number }[];
};

export type ApiUser = {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  tier: string;
  points: number;
  referralCode: string;
};

export type LoginResult =
  | { needsName: true }
  | { needsName?: undefined; token: string; user: ApiUser };

export type ApiAddress = {
  _id: string;
  label: string;
  fullAddress: string;
  note?: string;
  lat: number;
  lng: number;
  isDefault?: boolean;
};

export type AddressInput = {
  label: string;
  fullAddress: string;
  note?: string;
  isDefault?: boolean;
  lat?: number;
  lng?: number;
};

export type ApiCartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  options?: string[];
  note?: string;
  image?: string;
};

export type ApiCart = {
  restaurantId: string | null;
  restaurantName: string;
  items: ApiCartItem[];
};

export type ApiOrderItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  options?: string[];
  note?: string;
  image?: string;
};

export type ApiOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'delivering'
  | 'completed'
  | 'cancelled';

export type ApiOrder = {
  _id: string;
  restaurantId?: string;
  restaurantName: string;
  restaurantImage: string;
  status: ApiOrderStatus;
  items: ApiOrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  createdAt: string;
  paymentMethod?: string;
  note?: string;
  deliveryAddress?: {
    label: string;
    fullAddress: string;
    note?: string;
    lat?: number;
    lng?: number;
  };
  trackingSteps?: { key: string; label: string; done: boolean; at?: string }[];
  reviewed?: boolean;
};

export type ApiReview = {
  _id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ReviewsResponse = {
  reviews: ApiReview[];
  total: number;
  page: number;
  pages: number;
};

export type ApiVoucher = {
  _id: string;
  code: string;
  type: string;
  title: string;
  description: string;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiresAt?: string;
  filterTag: 'freeship' | 'discount' | 'payment';
  almostGone?: boolean;
};

export type ApiWallet = {
  tier: string;
  tierLabel: string;
  points: number;
  nextTier: string | null;
  pointsToNext: number;
  progress: number;
  referralCode: string;
  banners: ApiBanner[];
};

export type ApiMission = {
  id: string;
  title: string;
  description: string;
  points: number;
  target: number;
};

export type ApiSearchDish = {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  restaurant: ApiRestaurant;
};

export type ApiSearchResult = {
  query: string;
  restaurants: ApiRestaurant[];
  dishes: ApiSearchDish[];
};

export type HomeResponse = {
  banners: ApiBanner[];
  categories: ApiCategory[];
  restaurants: ApiRestaurant[];
};

export type MenuResponse = {
  restaurantId: string;
  restaurantName: string;
  sections: {
    featured: ApiMenuItem[];
    mains: ApiMenuItem[];
    drinks: ApiMenuItem[];
    desserts: ApiMenuItem[];
  };
  items: ApiMenuItem[];
};

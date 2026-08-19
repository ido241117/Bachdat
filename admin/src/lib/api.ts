const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8787";

const TOKEN_KEY = "mealnow_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }
  return data as T;
}

export type AdminUser = {
  id: string;
  phone: string;
  name: string;
  role: string;
};

export type Stats = {
  revenue: {
    all: number;
    today: number;
    month: number;
    completedOrders: number;
    completedToday: number;
    completedMonth: number;
  };
  counts: {
    restaurants: number;
    users: number;
    menuItems: number;
    vouchers?: number;
    banners?: number;
    ordersByStatus: Record<string, number>;
  };
  recentOrders: OrderRow[];
  topRestaurants: Array<{
    _id: string;
    name: string;
    revenue: number;
    orders: number;
  }>;
  last7Days?: Array<{ date: string; revenue: number; orders: number }>;
};

export type CategoryRow = {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type RestaurantRow = {
  _id: string;
  name: string;
  slug: string;
  coverImage?: string;
  address?: string;
  district?: string;
  city?: string;
  isOpen?: boolean;
  hasFreeShip?: boolean;
  isPopular?: boolean;
  priceLevel?: string;
  rating?: number;
  reviewCount?: number;
  menuCount?: number;
  location?: { coordinates: [number, number] };
  openingHours?: string;
  tags?: string[];
  categoryIds?: string[];
  deliveryTimeMin?: number;
  deliveryTimeMax?: number;
};

export type MenuRow = {
  _id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  menuSection: string;
  isFeatured?: boolean;
  isAvailable?: boolean;
  sortOrder?: number;
  options?: Array<{ name: string; price: number }>;
};

export type OrderRow = {
  _id: string;
  restaurantName: string;
  restaurantImage?: string;
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  paymentMethod: string;
  voucherCode?: string;
  note?: string;
  createdAt: string;
  deliveredAt?: string;
  deliveryAddress?: { fullAddress: string; label: string; note?: string };
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    options?: string[];
    note?: string;
  }>;
  trackingSteps?: Array<{
    key: string;
    label: string;
    done: boolean;
    at?: string;
  }>;
  user?: { name?: string; phone?: string } | null;
};

export type UserRow = {
  _id: string;
  phone: string;
  name: string;
  tier: string;
  points: number;
  role: string;
  createdAt: string;
};

export type VoucherRow = {
  _id: string;
  code: string;
  type: string;
  title: string;
  description?: string;
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  applicableTo?: string;
  applicableId?: string;
  totalLimit?: number;
  usedCount?: number;
  expiresAt?: string;
  filterTag?: string;
  isActive?: boolean;
};

export type BannerRow = {
  _id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  image?: string;
  linkType?: string;
  linkId?: string;
  screen?: string;
  sortOrder?: number;
  isActive?: boolean;
  expiresAt?: string;
};

export const api = {
  requestOtp: (phone: string) =>
    request<{ otp?: string }>("/auth/otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
  login: (phone: string, otp: string) =>
    request<{
      token: string;
      user: AdminUser & { role?: string };
      needsName?: boolean;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    }),
  me: () => request<AdminUser>("/admin/me"),
  stats: () => request<Stats>("/admin/stats"),

  categories: () => request<CategoryRow[]>("/admin/categories"),
  createCategory: (body: Record<string, unknown>) =>
    request<CategoryRow>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCategory: (id: string, body: Record<string, unknown>) =>
    request<CategoryRow>(`/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteCategory: (id: string) =>
    request<{ ok: boolean }>(`/admin/categories/${id}`, { method: "DELETE" }),

  restaurants: (q?: string) =>
    request<RestaurantRow[]>(
      `/admin/restaurants${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    ),
  restaurant: (id: string) =>
    request<RestaurantRow>(`/admin/restaurants/${id}`),
  createRestaurant: (body: Record<string, unknown>) =>
    request<RestaurantRow>("/admin/restaurants", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateRestaurant: (id: string, body: Record<string, unknown>) =>
    request<RestaurantRow>(`/admin/restaurants/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteRestaurant: (id: string) =>
    request<{ ok: boolean }>(`/admin/restaurants/${id}`, { method: "DELETE" }),

  menu: (restaurantId: string) =>
    request<MenuRow[]>(`/admin/restaurants/${restaurantId}/menu`),
  createMenu: (restaurantId: string, body: Record<string, unknown>) =>
    request<MenuRow>(`/admin/restaurants/${restaurantId}/menu`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateMenu: (itemId: string, body: Record<string, unknown>) =>
    request<MenuRow>(`/admin/menu/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteMenu: (itemId: string) =>
    request<{ ok: boolean }>(`/admin/menu/${itemId}`, { method: "DELETE" }),

  orders: (params?: { status?: string; q?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== "all") qs.set("status", params.status);
    if (params?.q) qs.set("q", params.q);
    const s = qs.toString();
    return request<OrderRow[]>(`/admin/orders${s ? `?${s}` : ""}`);
  },
  order: (id: string) => request<OrderRow>(`/admin/orders/${id}`),
  updateOrder: (id: string, status: string) =>
    request<OrderRow>(`/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  vouchers: () => request<VoucherRow[]>("/admin/vouchers"),
  createVoucher: (body: Record<string, unknown>) =>
    request<VoucherRow>("/admin/vouchers", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateVoucher: (id: string, body: Record<string, unknown>) =>
    request<VoucherRow>(`/admin/vouchers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteVoucher: (id: string) =>
    request<{ ok: boolean }>(`/admin/vouchers/${id}`, { method: "DELETE" }),

  banners: () => request<BannerRow[]>("/admin/banners"),
  createBanner: (body: Record<string, unknown>) =>
    request<BannerRow>("/admin/banners", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateBanner: (id: string, body: Record<string, unknown>) =>
    request<BannerRow>(`/admin/banners/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteBanner: (id: string) =>
    request<{ ok: boolean }>(`/admin/banners/${id}`, { method: "DELETE" }),

  users: (q?: string) =>
    request<UserRow[]>(
      `/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    ),
  setRole: (id: string, role: string) =>
    request<UserRow>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
};

export function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

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
    ordersByStatus: Record<string, number>;
  };
  recentOrders: OrderRow[];
  topRestaurants: Array<{
    _id: string;
    name: string;
    revenue: number;
    orders: number;
  }>;
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
  menuCount?: number;
  location?: { coordinates: [number, number] };
  openingHours?: string;
  tags?: string[];
};

export type MenuRow = {
  _id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  menuSection: string;
  isFeatured?: boolean;
  isAvailable?: boolean;
};

export type OrderRow = {
  _id: string;
  restaurantName: string;
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  paymentMethod: string;
  createdAt: string;
  deliveryAddress?: { fullAddress: string; label: string };
  items?: Array<{ name: string; quantity: number; price: number }>;
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
  restaurants: () => request<RestaurantRow[]>("/admin/restaurants"),
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
  orders: (status?: string) =>
    request<OrderRow[]>(
      `/admin/orders${status && status !== "all" ? `?status=${status}` : ""}`,
    ),
  updateOrder: (id: string, status: string) =>
    request<OrderRow>(`/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  users: () => request<UserRow[]>("/admin/users"),
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

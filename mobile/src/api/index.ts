import { api } from './client';
import type {
  ApiOrder,
  ApiUser,
  ApiVoucher,
  ApiWallet,
  ApiMission,
  ApiAddress,
  HomeResponse,
  MenuResponse,
} from './types';

export const authApi = {
  requestOtp: (phone: string) =>
    api<{ message: string; otp?: string; expiresIn: number }>('/auth/otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  login: (phone: string, otp: string) =>
    api<{ token: string; user: ApiUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),

  logout: () => api<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
};

export const homeApi = {
  get: (lat?: number, lng?: number) => {
    const q = new URLSearchParams();
    if (lat != null) q.set('lat', String(lat));
    if (lng != null) q.set('lng', String(lng));
    const qs = q.toString();
    return api<HomeResponse>(`/home${qs ? `?${qs}` : ''}`);
  },
};

export const restaurantApi = {
  getMenu: (id: string) => api<MenuResponse>(`/restaurants/${id}/menu`),
  getById: (id: string) => api(`/restaurants/${id}`),
};

export type TrackingStep = {
  key: string;
  label: string;
  done: boolean;
  at?: string;
};

export const ordersApi = {
  list: (status: 'active' | 'history') =>
    api<ApiOrder[]>(`/orders?status=${status}`),
  get: (id: string) => api<ApiOrder>(`/orders/${id}`),
  tracking: (id: string) =>
    api<{ orderId: string; status: string; trackingSteps: TrackingStep[] }>(
      `/orders/${id}/tracking`,
    ),
  create: (body: Record<string, unknown>) =>
    api<{ order: ApiOrder; pointsEarned: number }>('/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  cancel: (id: string) =>
    api<ApiOrder>(`/orders/${id}/cancel`, { method: 'POST' }),
  reorder: (id: string) =>
    api<{
      cart: {
        restaurantId: string;
        restaurantName: string;
        items: Array<{
          menuItemId: string;
          name: string;
          price: number;
          quantity: number;
          options?: string[];
          note?: string;
          image?: string;
        }>;
      };
      message: string;
    }>(`/orders/${id}/reorder`, { method: 'POST' }),
};

export const rewardsApi = {
  wallet: () => api<ApiWallet>('/rewards/wallet'),
  missions: () => api<ApiMission[]>('/rewards/missions'),
};

export const vouchersApi = {
  list: (filter?: string) => {
    const qs = filter ? `?filter=${filter}` : '';
    return api<ApiVoucher[]>(`/vouchers${qs}`);
  },
  save: (id: string) =>
    api<{ ok: boolean }>(`/vouchers/${id}/save`, { method: 'POST' }),
  validate: (code: string, subtotal: number, deliveryFee: number) =>
    api<{
      valid: boolean;
      discount: number;
      message: string;
    }>('/vouchers/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal, deliveryFee }),
    }),
};

export const userApi = {
  me: () => api<ApiUser & { addresses?: ApiAddress[] }>('/users/me'),
  addresses: () => api<ApiAddress[]>('/users/me/addresses'),
};

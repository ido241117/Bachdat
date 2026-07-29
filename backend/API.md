# QuickBite API — Frontend Integration Guide

**Base URL (production / device):** `https://bachdat.phanlethien.xyz`  
**Local:** `http://localhost:8787`

Tunnel Cloudflare `banhang-api` → `localhost:8787` (hostname: `bachdat.phanlethien.xyz`).

Content-Type: `application/json`  
Auth header (các route cần login):

```
Authorization: Bearer <token>
```

Demo:
```
POST /auth/otp     { "phone": "0901234567" }   → otp: "123456"
POST /auth/login   { "phone": "0901234567", "otp": "123456" }
```

Lỗi chuẩn: `{ "error": "message" }` (HTTP 4xx/5xx).

---

## 0. Setup client (Expo / RN)

```ts
// src/api/client.ts
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://bachdat.phanlethien.xyz';

let token: string | null = null;
export const setToken = (t: string | null) => { token = t; };

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}
```

`.env` mobile:
```
EXPO_PUBLIC_API_URL=https://bachdat.phanlethien.xyz
# Local only: http://localhost:8787
# Android emulator local: http://10.0.2.2:8787
```

Lưu token sau login (`AsyncStorage`) rồi `setToken(token)`.

> **Lưu ý:** Domain chỉ sống khi máy local chạy `npm run dev` **và** `cloudflared tunnel run banhang-api`.

---

## 1. Mapping màn hình → API

| Màn mobile | Thay mock bằng |
|------------|----------------|
| `HomeScreen` | `GET /home` |
| `RestaurantDetailScreen` | `GET /restaurants/:id` + `GET /restaurants/:id/menu` |
| Cart bar / sync | `GET/PUT /cart` (hoặc giữ local, sync khi checkout) |
| `CheckoutScreen` | `POST /vouchers/validate` → `POST /orders` |
| `OrdersScreen` | `GET /orders?status=active\|history` |
| Order tracking | `GET /orders/:id/tracking` |
| `RewardsScreen` | `GET /rewards/wallet` + `GET /vouchers` |
| `ProfileScreen` | `GET /users/me` + addresses / payment-methods |

---

## 2. Auth

### `POST /auth/otp`
```json
// body
{ "phone": "0901234567" }

// response (dev trả luôn OTP)
{ "message": "OTP đã gửi (dev mode)", "otp": "123456", "expiresIn": 300 }
```

### `POST /auth/login`
```json
// body
{ "phone": "0901234567", "otp": "123456" }

// response
{
  "token": "eyJ...",
  "user": {
    "id": "...",
    "phone": "0901234567",
    "name": "Minh Anh",
    "avatar": "",
    "tier": "gold",
    "points": 2450,
    "referralCode": "QB4567MINH"
  }
}
```

Phone mới → tự tạo user.  
`POST /auth/logout` — cần Bearer, trả `{ ok: true }` (client tự xóa token).

---

## 3. Trang chủ — `GET /home?lat=&lng=`

Không bắt buộc auth.

```ts
type HomeResponse = {
  banners: Banner[];
  categories: Category[];
  restaurants: Restaurant[]; // kèm distanceKm
};
```

**Map sang UI hiện tại (`restaurants.ts`):**

| UI field | API field |
|----------|-----------|
| `id` | `_id` |
| `name` | `name` |
| `image` / `heroImage` | `coverImage` |
| `rating` | `rating` |
| `reviewCount` | `reviewCount` (number → format `"1k+"` ở client) |
| `deliveryTime` | `` `${deliveryTimeMin}-${deliveryTimeMax} phút` `` |
| `distance` | `` `${distanceKm} km` `` |
| `tags` / `cuisine` | `tags.join(', ')` |
| `priceLevel` | `priceLevel` (`$` / `$$` / `$$$`) |
| `freeship` | `hasFreeShip` |
| `popular` | `isPopular` |

Categories: `{ _id, name, slug, icon, sortOrder }`  
→ filter quán: `GET /restaurants?category=bun-pho` (slug) hoặc `?category=<ObjectId>`.

Banners: `{ title, subtitle, tag, image, linkType, linkId, screen }`.

---

## 4. Quán & Menu

### `GET /restaurants?search=&category=&lat=&lng=&popular=true`
List quán (có `distanceKm`).

### `GET /restaurants/:id`
`:id` = Mongo `_id` **hoặc** `slug` (vd. `bep-viet-delights`).

### `GET /restaurants/:id/menu`

```json
{
  "restaurantId": "...",
  "restaurantName": "Bếp Việt Delights",
  "sections": {
    "featured": [ /* MenuItem */ ],
    "mains": [],
    "drinks": [],
    "desserts": []
  },
  "items": [ /* flat list */ ]
}
```

**MenuItem:**

| UI field | API field |
|----------|-----------|
| `id` | `_id` |
| `name`, `price`, `description`, `image` | giống |
| `category` | `menuSection` (`featured` \| `mains` \| `drinks` \| `desserts`) |
| options | `options[]` → `{ name, price }` |

---

## 5. User / Hồ sơ

Tất cả cần Bearer.

| Method | Path | Mô tả |
|--------|------|--------|
| `GET` | `/users/me` | Profile đầy đủ |
| `PATCH` | `/users/me` | `{ name?, avatar?, notificationSettings? }` |
| `GET` | `/users/me/addresses` | Danh sách địa chỉ |
| `POST` | `/users/me/addresses` | Thêm địa chỉ |
| `PATCH` | `/users/me/addresses/:id` | Sửa / set default |
| `DELETE` | `/users/me/addresses/:id` | Xóa |
| `GET` | `/users/me/payment-methods` | MoMo, ZaloPay, card, cash |
| `GET` | `/users/me/vouchers` | Voucher đã lưu |

**Address body:**
```json
{
  "label": "Căn hộ B12, Tòa nhà Sky",
  "fullAddress": "123 Đường Lê Lợi, Quận 1, TP.HCM",
  "note": "Để ở sảnh lễ tân",
  "lat": 10.7769,
  "lng": 106.7009,
  "isDefault": true
}
```

---

## 6. Giỏ hàng

Có thể giữ cart **local** (AsyncStorage / context). API sync tùy chọn:

| Method | Path | Body |
|--------|------|------|
| `GET` | `/cart` | — |
| `PUT` | `/cart` | `{ restaurantId, restaurantName, items[] }` |
| `DELETE` | `/cart` | xóa giỏ |

**Cart item:**
```json
{
  "menuItemId": "<ObjectId>",
  "name": "Phở Bò Đặc Biệt",
  "price": 65000,
  "quantity": 1,
  "options": ["Ít hành"],
  "note": "",
  "image": "https://..."
}
```

Rule: **1 quán / 1 giỏ** — đổi quán thì clear items cũ.

---

## 7. Thanh toán / Đặt đơn

### B1 — Validate voucher
`POST /vouchers/validate` (auth)

```json
// body
{ "code": "QUICKBITE20", "subtotal": 120000, "deliveryFee": 15000 }

// ok
{ "valid": true, "voucher": { ... }, "discount": 24000, "message": "Giảm 24.000đ" }
```

### B2 — Tạo đơn
`POST /orders` (auth)

```json
{
  "restaurantId": "<ObjectId>",
  "items": [
    {
      "menuItemId": "<ObjectId>",
      "quantity": 1,
      "options": ["Ít hành"],
      "note": ""
    }
  ],
  "deliveryAddress": {
    "label": "Căn hộ B12",
    "fullAddress": "123 Lê Lợi, Q1",
    "note": "Sảnh lễ tân",
    "lat": 10.7769,
    "lng": 106.7009
  },
  "paymentMethod": "momo",
  "voucherCode": "QUICKBITE20",
  "note": "",
  "deliveryFee": 15000
}
```

`paymentMethod`: `cash` | `momo` | `zalopay` | `card`

**Response:**
```json
{
  "order": { /* Order document */ },
  "pointsEarned": 96
}
```

Server tự tính `subtotal` / `discount` / `total`, clear cart, cộng điểm (~1đ / 1000đ).

---

## 8. Đơn hàng

| Method | Path | Mô tả |
|--------|------|--------|
| `GET` | `/orders?status=active` | pending → delivering |
| `GET` | `/orders?status=history` | completed / cancelled |
| `GET` | `/orders/:id` | Chi tiết |
| `GET` | `/orders/:id/tracking` | `trackingSteps[]` |
| `POST` | `/orders/:id/cancel` | Chỉ khi pending/confirmed |
| `POST` | `/orders/:id/reorder` | Đổ lại vào cart |

**Order status flow:**
```
pending → confirmed → preparing → delivering → completed
                                              ↘ cancelled
```

**Tracking response:**
```json
{
  "orderId": "...",
  "status": "delivering",
  "trackingSteps": [
    { "key": "pending", "label": "Đã đặt đơn", "done": true, "at": "..." },
    { "key": "confirmed", "label": "Quán xác nhận", "done": true },
    { "key": "preparing", "label": "Đang chuẩn bị", "done": true },
    { "key": "delivering", "label": "Đang giao", "done": true },
    { "key": "completed", "label": "Hoàn thành", "done": false }
  ]
}
```

**Order fields dùng UI:**  
`restaurantName`, `restaurantImage`, `items[]`, `subtotal`, `deliveryFee`, `discount`, `total`, `status`, `createdAt`, `paymentMethod`.

---

## 9. Ưu đãi / Rewards

### `GET /vouchers?filter=freeship|discount|payment`
Public. Có field `almostGone` (gần hết lượt).

### `POST /vouchers/:id/save` (auth)
Lưu vào `users.savedVoucherIds`.

### `GET /rewards/wallet` (auth)
```json
{
  "tier": "gold",
  "tierLabel": "Vàng",
  "points": 2450,
  "nextTier": "diamond",
  "pointsToNext": 550,
  "progress": 63,
  "referralCode": "QB4567MINH",
  "banners": [ /* screen=rewards */ ]
}
```

### `GET /rewards/missions`
Static config nhiệm vụ săn điểm (không cần auth).

**Voucher seed dùng thử:** `QUICKBITE20`, `FREESHIP`, `GIAM30K`, `MOMO10`.

---

## 10. Helper format giá / khoảng cách

```ts
export const formatPrice = (n: number) =>
  n.toLocaleString('vi-VN') + 'đ';

export const formatDistance = (km: number) => `${km} km`;

export const formatDelivery = (min: number, max: number) =>
  `${min}-${max} phút`;

export const formatReviews = (n: number) =>
  n >= 1000 ? `${Math.floor(n / 1000)}k+` : String(n);
```

---

## 11. Gợi ý thứ tự gắn API

1. `api/client.ts` + auth login → lưu token  
2. `HomeScreen` ← `GET /home`  
3. `RestaurantDetailScreen` ← menu API  
4. Cart context (local) → Checkout `POST /orders`  
5. `OrdersScreen` + tracking  
6. `RewardsScreen` + vouchers  
7. `ProfileScreen` + addresses  

---

## 12. Health check

```
GET /health → { status: "ok", service: "quickbite-api", timestamp }
```

Backend chạy: `cd backend && npm run seed && npm run dev`

# Khởi động app

## 1. Backend (Terminal 1)
```
cd backend
npm run seed    # lần đầu / reset data MongoDB
npm run dev
```

MongoDB local: `mongodb://localhost:27017/mealnow`

Demo login: phone `0901234567` / OTP `123456`

API docs (frontend gắn): `backend/API.md`

## 2. Cloudflare Tunnel (Terminal 2)

### Lần đầu (chưa setup tunnel / chưa add domain)
1. Add **bachdat.site** vào Cloudflare Dashboard → Sites → Add a site (Free plan).
2. Ở iNET OnePortal → domain `bachdat.site` → **Cập nhật DNS** / đổi Nameserver sang 2 NS Cloudflare đưa (thay `catba.vclouddns.com` / `haiphong.vclouddns.com`). Chờ NS active (có thể vài phút–vài giờ).
3. Máy này:
```
cloudflared tunnel login
cloudflared tunnel create banhang-api
cloudflared tunnel route dns banhang-api bachdat.site
```
4. Tạo `%USERPROFILE%\.cloudflared\config.yml` (xem mẫu trong repo `cloudflared/config.example.yml`).

### Mỗi lần chạy
```
cloudflared tunnel run banhang-api
```

Public URL: **https://bachdat.site**  
(→ `localhost:8787`)

Health: https://bachdat.site/health

## 3. Mobile (Terminal 3)
```
cd mobile
# Điền key Goong trong .env (xem .env.example)
npx expo start -c
```

Goong: `EXPO_PUBLIC_GOONG_MAPS_KEY` (map tiles) + `EXPO_PUBLIC_GOONG_API_KEY` (Places/Directions).

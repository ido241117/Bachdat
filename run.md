# Khởi động app

Thứ tự: MongoDB → Backend → Tunnel → Mobile

## MongoDB

MongoDB phải chạy trước backend. Bật service (cần admin):

```powershell
Start-Service MongoDB
```

Hoặc `services.msc` → **MongoDB Server** → Start.

Compass: `mongodb://127.0.0.1:27017/mealnow`

## Backend

```powershell
cd backend
npm run seed    # lần đầu / reset data
npm run dev
```

Demo: `0901234567` / OTP `123456`  
Health: http://127.0.0.1:8787/health

## Cloudflare Tunnel

```powershell
cloudflared tunnel run banhang-api
```

Public: https://bachdat.site → `127.0.0.1:8787`  
Config mẫu: `cloudflared/config.example.yml`

## Mobile

```powershell
cd mobile
npx expo start -c
```

## Admin

```powershell
cd admin
npm install   # lần đầu
npm run dev
```

http://localhost:5173 — Admin: `0909999999` / OTP `123456`

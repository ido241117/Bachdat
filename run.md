# Khởi động app

## 1. Backend (Terminal 1)
```
cd backend
npm run seed    # lần đầu / reset data MongoDB
npm run dev
```

MongoDB local: `mongodb://localhost:27017/quickbite`

Demo login: phone `0901234567` / OTP `123456`

API docs (frontend gắn): `backend/API.md`

## 2. Cloudflare Tunnel (Terminal 2)
```
cloudflared tunnel run banhang-api
```

Public URL: **https://bachdat.phanlethien.xyz**  
(→ `localhost:8787`)

Health: https://bachdat.phanlethien.xyz/health

## 3. Mobile (Terminal 3)
```
cd mobile
npx expo start
```

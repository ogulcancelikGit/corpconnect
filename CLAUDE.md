# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proje

CorpConnect — şirket içi çalışan yönetim platformu (Mobilyaka benzeri kurumsal intranet). Türkçe arayüz.

**Stack:** Node.js + Express + Prisma + MySQL 8 + Socket.IO (backend) · React 19 + Vite + Tailwind v4 + react-router v7 (frontend).

## Komutlar

### Backend (`backend/`)
```
npm run dev         # nodemon src/server.js
npm start           # prod
npm run migrate     # prisma migrate dev
npm run seed        # node prisma/seed.js
npm run studio      # prisma studio
```
Test altyapısı **yok** (`backend/tests/` boş, framework kurulu değil). Prod'a çıkmadan önce Jest+Supertest eklenmesi planda.

### Frontend (`frontend/`)
```
npm run dev         # vite (port 5173, /api → localhost:5000 proxy)
npm run build
npm run lint        # eslint
npm run preview
```

## Roller

3 rol var: `ADMIN`, `MANAGER`, `EMPLOYEE`.
- **ADMIN** → sadece `/superadmin/*` (ayrı layout, `SuperAdminLayout.jsx`). Login sonrası otomatik yönlendirilir.
- **MANAGER** ve **EMPLOYEE** → `/` (normal `Layout.jsx`). MANAGER bazı onay akışlarında (izin, masraf) yetkili.
- Route koruma: `frontend/src/App.jsx` içindeki `ProtectedRoute` bileşeni `roles` prop'u ile.

## Mimari — Backend

Giriş: `backend/src/server.js` → `routes/index.js` tüm route modüllerini `/api` altında toplar.

**Katmanlar:**
- `routes/*.routes.js` — express router + `validate.middleware` + `auth.middleware` + `role.middleware`
- `validations/*.validation.js` — express-validator chain'leri (`validate.middleware` ile koşturulur)
- `controllers/*.controller.js` — iş mantığı, Prisma çağrıları
- `middleware/` — auth (JWT decode + user lookup), role (`requireRole('ADMIN')`), validate, upload (multer wrapper), error (global handler, Prisma P2002/P2025 yakalar)
- `utils/` — `response.util.js` (envelope), `pagination.util.js`, `jwt.util.js` (access 15m / refresh 7d), `bcrypt.util.js` (10 rounds), `activityLog.util.js`
- `config/` — cors, helmet (CSP + HSTS), multer (10MB, whitelist MIME), socket (Socket.IO init)
- `socket/handlers/` — konuşma/mesaj/bildirim socket event'leri

**Prisma:** `prisma/schema.prisma` tek dosyada tüm modeller. Enum'lar dosyanın başında (Role, NotificationType, LeaveStatus, ExpenseStatus, SuggestionStatus/Category, EventType, TaskStatus/Priority). Migration'lar `prisma/migrations/`.

**Response envelope (her zaman kullan):**
```js
const { success, error, paginated } = require('../utils/response.util')
success(res, data, message, 200)
error(res, message, 400, errors)
paginated(res, data, paginationMeta)
```
Format: `{ success: bool, message: string, data | errors, pagination? }`.

**Pagination:** `utils/pagination.util.js` — tüm liste endpoint'lerinde kullan. `?page=&limit=` query, default 1/15.

**Activity Log:** Yazma işlemlerinde `activityLog.util.js` ile kayıt at (audit trail için kritik — admin `/logs` sayfası bundan besleniyor).

**Rate limit:** Global limiter `server.js`'te aktif (15dk / 300 istek, `/api/health` hariç). `/auth` route'unda ek sıkı limit (15dk / 10 deneme).

**Dosya yükleme:** `POST /api/files/upload` → `fileId` döner → ilgili kayıt (mesaj, masraf fişi, avatar) bu id ile bağlanır. Uploads `/uploads` static.

## Mimari — Frontend

**Context ağacı (App.jsx):** `ThemeProvider → AuthProvider → SocketProvider → NotificationProvider`.

- `AuthContext` — login/logout, user state, token refresh interceptor'ı `services/api.service.js`'te.
- `SocketContext` — tek Socket.IO connection, auth user varsa bağlanır.
- `NotificationContext` — socket'ten gelen bildirimleri state'e iter, toast gösterir.
- `ThemeContext` — dark mode için `localStorage` + `html.classList`. **Dikkat:** `dark:` Tailwind class'ları sadece `CalendarPage.jsx`'te uygulanmış, diğer sayfalarda eksik (bilinen tutarsızlık).

**API servisleri:** `frontend/src/services/*.service.js` — axios instance `api.service.js`'te, `VITE_API_URL` okur, request interceptor'ı token ekler, response interceptor'ı 401'de refresh dener.

**İstisna:** `pages/admin/superadmin/ReportsAdminPage.jsx` axios'u bypass edip `localStorage.getItem('accessToken')` ile ham `fetch` yapıyor (düzeltilmesi gerek).

**Layout:**
- `components/layout/Layout.jsx` + `Navbar.jsx` — normal kullanıcı (MANAGER/EMPLOYEE)
- `components/layout/SuperAdminLayout.jsx` — ADMIN paneli (sidebar'lı)
- `components/common/` **boş** — `EmptyState`, `LoadingSpinner` vb. henüz ortak bileşen haline getirilmemiş, her sayfa kendi yapıyor.

**Form validasyon:** react-hook-form + Zod kullanımda. Şemalar `frontend/src/schemas/*.schema.js` altında, sayfalarda `zodResolver` ile bağlanıyor. Toast feedback için `react-hot-toast`.

## Konvansiyonlar

- **Dil:** Kullanıcıya görünen tüm metinler Türkçe (UI, toast, error mesajları, console mesajları bile).
- **Tarih/para:** `date-fns` kullanımda. Para format için yardımcı yok, manuel.
- **Migration isim:** `YYYYMMDDHHMMSS_snake_case_açıklama` (tarihler 2026-04 civarında).
- **Tüm değiştirici (POST/PUT/PATCH/DELETE) endpoint'ler `auth.middleware`'den geçmeli**; admin-only olanlar `role.middleware('ADMIN')`.
- **Yeni modül eklerken mevcut deseni kopyala:** `suggestion` (basit CRUD) veya `leave` (onay akışı) iyi referans.

## Bilinen Eksikler (Planlanan, uygulamadan)

Şu an mevcut (eskiden eksik listesindeydi, artık yapıldı): winston logger (`utils/logger.js`), global rate limit (`server.js`), React ErrorBoundary (`App.jsx`), react-hook-form + Zod form validasyonu.

Halen eksik / gelecek çalışmalar: Dockerfile/compose, CI/CD, minimum entegrasyon testi (Jest+Supertest / Vitest), KVKK aydınlatma metni, Swagger/OpenAPI API dokümantasyonu, dark mode `dark:` class'larının tüm sayfalara yayılması, birkaç admin sayfasının (`ReportsAdminPage`, `OverviewPage`) `services/` katmanına taşınması. `.env` gitignore'da (sızıntı yok); örnek dosyadaki placeholder secret'lar gerçek değerle değiştirilmeli.

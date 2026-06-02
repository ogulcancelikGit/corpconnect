# CorpConnect

**Şirket içi çalışan yönetim ve iletişim platformu** — kurumsal bir intranet uygulaması.
Çalışanların görev, izin, masraf, mesajlaşma, duyuru, anket, eğitim, takvim ve öneri
süreçlerini tek bir platformda toplar; yöneticilere onay akışları ve raporlama, sistem
yöneticilerine ayrı bir yönetim paneli sunar.

> Bitirme projesi olarak geliştirilmiştir. Arayüz tamamen Türkçedir.

---

## İçindekiler
- [Özellikler](#özellikler)
- [Teknoloji Stack'i](#teknoloji-stacki)
- [Mimari](#mimari)
- [Kurulum](#kurulum)
- [Demo Hesapları](#demo-hesapları)
- [Komutlar](#komutlar)
- [Proje Yapısı](#proje-yapısı)
- [Gelecek Çalışmalar](#gelecek-çalışmalar)

---

## Özellikler

| Modül | Açıklama |
|-------|----------|
| **Kimlik Doğrulama** | JWT (access 15dk / refresh 7gün), şifre sıfırlama (e-posta), rol bazlı erişim |
| **Görev Yönetimi** | Kanban panosu (Yapılacak / Devam / İncelemede / Bitti), sürükle-bırak, yorum, etiket, kontrol listesi, WIP limiti |
| **İzin Yönetimi** | İzin talebi, gün hesaplama, yönetici onay/red akışı |
| **Masraf Yönetimi** | Masraf bildirimi, fiş yükleme, onay süreci |
| **Mesajlaşma** | Birebir ve grup sohbetleri, dosya eki, emoji reaksiyonu, anlık iletim (Socket.IO) |
| **Bildirimler** | Gerçek zamanlı bildirimler, tercih yönetimi, toast gösterimi |
| **Duyuru / Haber** | Kategorili duyuru yayınlama, sabitleme |
| **Anket** | Anket oluşturma, oylama, sonuç gösterimi |
| **Eğitim** | Eğitim içerikleri, kategoriler, detay sayfası |
| **Takvim** | Etkinlik oluşturma, katılımcı/RSVP, aylık ve liste görünümü |
| **Öneri Sistemi** | Çalışan önerileri (anonim seçeneği ile), durum takibi |
| **Kutlamalar** | Doğum günü / iş yıldönümü otomatik bildirimleri (cron) |
| **Raporlama** | İzin/kullanıcı raporları, CSV dışa aktarım |
| **Yönetim Paneli** | ADMIN için ayrı SuperAdmin paneli: kullanıcılar, loglar, raporlar, broadcast, ayarlar |
| **Aktivite Logları** | Tüm yazma işlemleri için denetim izi (audit trail) |

---

## Teknoloji Stack'i

**Backend**
- Node.js + Express 4
- Prisma ORM + MySQL 8
- Socket.IO (gerçek zamanlı mesaj/bildirim)
- JWT (jsonwebtoken) + bcryptjs
- express-validator, helmet, cors, express-rate-limit
- Winston (loglama), Nodemailer (e-posta), node-cron (zamanlanmış görevler)

**Frontend**
- React 19 + Vite
- Tailwind CSS v4
- React Router v7
- react-hook-form + Zod (form validasyonu)
- Axios, socket.io-client, date-fns, react-hot-toast, lucide-react

---

## Mimari

**Roller:** `ADMIN`, `MANAGER`, `EMPLOYEE`
- **ADMIN** → yalnızca `/superadmin/*` (ayrı layout). Giriş sonrası otomatik yönlendirilir.
- **MANAGER** / **EMPLOYEE** → normal layout (`/`). MANAGER, izin/masraf gibi akışlarda onaylama yetkisine sahiptir.

**Backend katmanları:** `routes → validations (express-validator) → controllers (Prisma) → middleware (auth, role, validate, upload, error)`.
Tüm yanıtlar ortak bir zarf (envelope) kullanır: `{ success, message, data | errors, pagination? }`.
Liste endpoint'lerinde sayfalama (`?page=&limit=`) standarttır.

**Frontend context ağacı:** `ThemeProvider → AuthProvider → SocketProvider → NotificationProvider`.
API çağrıları `services/*.service.js` katmanı üzerinden yapılır; Axios interceptor'ı token ekler ve 401'de refresh dener.
Beklenmeyen hatalar `App.jsx` içindeki `ErrorBoundary` ile yakalanır.

Daha ayrıntılı geliştirici notları için `CLAUDE.md` dosyasına bakın.

---

## Kurulum

### Önkoşullar
- Node.js 18+
- MySQL 8 (çalışır durumda)

### 1) Veritabanı
MySQL'de boş bir veritabanı oluşturun:
```sql
CREATE DATABASE corpconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2) Backend
```bash
cd backend
cp .env.example .env          # .env'i kendi DB/secret bilgilerinizle doldurun
npm install
npm run migrate               # Prisma migration'larını uygula
npm run seed                  # admin/manager/employee demo hesapları + sistem ayarları
npm run seed:employees        # (opsiyonel) 50 demo çalışan
npm run dev                   # http://localhost:5000
```
Sağlık kontrolü: `http://localhost:5000/api/health` → `{ "success": true }`.

### 3) Frontend
```bash
cd frontend
cp .env.example .env          # VITE_API_URL'i ayarlayın
npm install
npm run dev                   # http://localhost:5173 (/api ve /uploads → 5000'e proxy)
```

---

## Demo Hesapları

`npm run seed` sonrası kullanılabilir:

| Rol | E-posta | Şifre |
|-----|---------|-------|
| ADMIN | `admin@corpconnect.com` | `Admin123!` |
| MANAGER | `manager@corpconnect.com` | `Admin123!` |
| EMPLOYEE | `employee@corpconnect.com` | `Admin123!` |

`npm run seed:employees` sonrası ek olarak `employee1@corpconnect.com` … `employee50@corpconnect.com`
hesapları oluşur (şifre: `Employee123!`).

---

## Komutlar

**Backend** (`backend/`)
```
npm run dev             # nodemon ile geliştirme
npm start               # production
npm run migrate         # prisma migrate dev
npm run seed            # temel demo veriler
npm run seed:employees  # 50 demo çalışan
npm run studio          # Prisma Studio (DB görüntüleyici)
```

**Frontend** (`frontend/`)
```
npm run dev             # Vite geliştirme sunucusu (5173)
npm run build           # production build
npm run preview         # build önizleme
npm run lint            # ESLint
```

---

## Proje Yapısı

```
Corp_Connect/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # tüm modeller + enum'lar
│   │   ├── migrations/          # sürümlenmiş şema değişiklikleri
│   │   ├── seed.js              # temel demo veriler
│   │   └── seed-employees.js    # 50 demo çalışan
│   └── src/
│       ├── server.js            # giriş noktası (Express + Socket.IO + cron)
│       ├── routes/              # /api altındaki route modülleri
│       ├── controllers/         # iş mantığı (Prisma çağrıları)
│       ├── validations/         # express-validator zincirleri
│       ├── middleware/          # auth, role, validate, upload, error
│       ├── socket/              # Socket.IO handler'ları
│       ├── jobs/                # node-cron görevleri (kutlama, görev hatırlatma)
│       ├── config/              # cors, helmet, multer, socket
│       └── utils/               # response, pagination, jwt, bcrypt, logger, mailer, activityLog
└── frontend/
    └── src/
        ├── App.jsx              # router + ErrorBoundary + context ağacı
        ├── pages/               # sayfa bileşenleri (auth, tasks, messaging, admin/superadmin, …)
        ├── components/          # layout/ + common/ (ortak bileşenler)
        ├── context/             # Auth, Theme, Socket, Notification
        ├── services/            # API çağrı katmanı (axios)
        ├── schemas/             # Zod validasyon şemaları
        ├── hooks/               # useAuth, useSocket, usePagination, …
        └── constants/           # rotalar, roller, socket event'leri
```

---

## Gelecek Çalışmalar

Aşağıdaki maddeler bu sürümün kapsamı dışında olup gelecek geliştirmeler için planlanmıştır:

- **Otomatik test altyapısı** — backend için Jest + Supertest, frontend için Vitest + React Testing Library
- **Konteynerleştirme ve CI/CD** — Dockerfile + docker-compose, GitHub Actions pipeline
- **Karanlık tema** — `ThemeContext` hazır; `dark:` Tailwind sınıflarının tüm sayfalara yayılması
- **Servis katmanı tutarlılığı** — birkaç admin sayfasının (`ReportsAdminPage`, `OverviewPage`) doğrudan
  `api` çağrısı yerine `services/` katmanına taşınması
- **API dokümantasyonu** — Swagger/OpenAPI ile endpoint dokümantasyonu
- **İzleme ve ölçeklenme** — merkezi log toplama, performans izleme (APM), Redis önbellek
- **KVKK uyumu** — aydınlatma metni ve kişisel veri işleme onayları
```

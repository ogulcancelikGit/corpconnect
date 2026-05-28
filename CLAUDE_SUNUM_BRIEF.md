# CorpConnect — Sunum İçin Proje Brief'i

> Bu dosyayı Claude'a (claude.ai) yapıştır ve sonuna istediğin şeyi yaz.
> Örn: "Bu projeden sınıfta anlatmak için 10 slaytlık basit bir sunum hazırla."

---

## Proje Adı
**CorpConnect** — Şirket içi çalışan yönetim platformu (kurumsal intranet).

## Amaç
Şirketlerde iletişim genelde dağınık (e-posta, WhatsApp, sözlü). Bilgiler kayboluyor, yeni çalışanlar geç adapte oluyor. CorpConnect çalışanların mesajlaşma, haberler, eğitim, anket gibi tüm ihtiyaçlarını tek bir platformda topluyor. Arayüz Türkçe.

## Kullanıcı Rolleri
- **ADMIN** — Sistem yöneticisi. Ayrı bir SuperAdmin paneli var, tüm verilere erişebiliyor.
- **MANAGER** — Yönetici. İzin, masraf gibi onay süreçlerinde yetkili.
- **EMPLOYEE** — Standart çalışan. Günlük modülleri kullanır.

Her rol kendi yetkisine göre farklı sayfalar görüyor (route koruma ile).

## Özellikler / Modüller
- **Anlık mesajlaşma** — Socket.IO ile gerçek zamanlı sohbet
- **Şirket haberleri / duyurular**
- **Eğitim modülü** — kurs ve içerikler
- **Anket sistemi**
- **Bildirim sistemi** — anlık push notification
- **Profil yönetimi** ve dosya yükleme
- **Dashboard** — günlük özet
- **Admin paneli** — kullanıcı yönetimi, raporlar, aktivite logları

## Teknoloji Stack'i
**Backend:**
- Node.js + Express
- Prisma ORM
- MySQL 8 veritabanı
- Socket.IO (gerçek zamanlı iletişim)
- JWT kimlik doğrulama (15 dk access + 7 gün refresh token)
- Bcrypt ile şifre hashleme

**Frontend:**
- React 19
- Vite (build tool)
- Tailwind CSS v4
- React Router v7
- Axios (API çağrıları)
- React Hot Toast (bildirimler)

## Mimari
**Backend katmanları:**
`routes → validations → controllers → Prisma → MySQL`

- Routes: Express router
- Validations: express-validator ile input doğrulama
- Middleware: auth (JWT decode), role (yetki kontrolü), error handler
- Controllers: iş mantığı ve veritabanı çağrıları
- Tüm yanıtlar standart envelope formatında: `{ success, message, data, errors? }`

**Frontend mimarisi:**
- Context API ile state yönetimi: `ThemeProvider → AuthProvider → SocketProvider → NotificationProvider`
- Servis katmanı: her modül için ayrı `*.service.js` dosyası
- Korumalı route'lar: `ProtectedRoute` bileşeni rol bazlı erişim sağlıyor

## Güvenlik
- JWT token tabanlı oturum
- Bcrypt (10 round) şifre hashleme
- Rol bazlı erişim kontrolü
- Auth endpoint'lerinde rate limit (15 dk içinde 10 deneme)
- Helmet + CORS yapılandırması
- Dosya yüklemede 10 MB limit ve MIME tipi whitelist
- Tüm yazma işlemleri activity log'a kaydediliyor (audit trail)

## Geliştirici Notları
- Tek geliştirici tarafından yapıldı (öğrenci projesi).
- Modüler yapı sayesinde yeni özellik eklemek kolay.
- Canlıya çıkmadan önce eklenecekler: Docker, winston logger, global rate limit, React ErrorBoundary, integration testleri, KVKK aydınlatma metni.

---

## Claude'a Verilebilecek Örnek İstekler

- "Bu projeden 10 slaytlık basit bir sınıf sunumu hazırla, anlatım metniyle birlikte."
- "Bu projeyi sınıfta 5 dakikada nasıl anlatırım, konuşma metni yaz."
- "Bu projeden teknik bir sunum hazırla, mimariyi vurgula."
- "Bu projeyi tanıtan kısa bir poster içeriği hazırla."

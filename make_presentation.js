const PptxGenJS = require("pptxgenjs");
const pptx = new PptxGenJS();

pptx.layout = "LAYOUT_WIDE";
pptx.title = "CorpConnect Sunumu";

const PRIMARY = "1F4E79";
const ACCENT = "2E75B6";
const TEXT = "333333";
const BG = "F5F7FA";

function titleSlide(title, subtitle) {
  const s = pptx.addSlide();
  s.background = { color: PRIMARY };
  s.addText(title, {
    x: 0.5, y: 2.2, w: 12, h: 1.5,
    fontSize: 54, bold: true, color: "FFFFFF", align: "center", fontFace: "Calibri"
  });
  s.addText(subtitle, {
    x: 0.5, y: 3.8, w: 12, h: 0.8,
    fontSize: 24, color: "DDE7F2", align: "center", fontFace: "Calibri"
  });
  return s;
}

function contentSlide(title, bullets) {
  const s = pptx.addSlide();
  s.background = { color: BG };
  s.addShape("rect", { x: 0, y: 0, w: 13.33, h: 1.0, fill: { color: PRIMARY } });
  s.addText(title, {
    x: 0.5, y: 0.15, w: 12, h: 0.7,
    fontSize: 30, bold: true, color: "FFFFFF", fontFace: "Calibri"
  });
  s.addText(
    bullets.map(b => ({ text: b, options: { bullet: { code: "25A0" }, color: TEXT, fontSize: 22, paraSpaceAfter: 10 } })),
    { x: 0.7, y: 1.4, w: 12, h: 5.8, fontFace: "Calibri" }
  );
  return s;
}

// 1. Kapak
titleSlide("CorpConnect", "Şirket İçi Çalışan Yönetim Platformu");

// 2. Proje Nedir
contentSlide("Proje Nedir?", [
  "Şirket içi iletişim ve yönetim için bir intranet uygulaması",
  "Çalışanlar tek bir platformda buluşuyor: mesajlaşma, haberler, eğitim, anket",
  "Yöneticiler için raporlama ve yönetim paneli (SuperAdmin)",
  "Türkçe arayüz, kurumsal kullanıma uygun tasarım"
]);

// 3. Neden Yapıldı
contentSlide("Neden Bu Projeyi Yaptım?", [
  "Şirketlerde iletişim genelde dağınık: e-posta, WhatsApp, sözlü...",
  "Bilgiler kayboluyor, yeni çalışanlar geç adapte oluyor",
  "Tek bir kurumsal platformda her şeyi toplamak hedeflendi",
  "Modern web teknolojilerini uçtan uca uygulama fırsatı"
]);

// 4. Kullanıcı Rolleri
contentSlide("Kullanıcı Rolleri", [
  "ADMIN — Sistem yöneticisi, tüm verilere erişim, SuperAdmin paneli",
  "MANAGER — Yönetici, onay süreçlerinde yetkili (izin, masraf vb.)",
  "EMPLOYEE — Standart çalışan, günlük modülleri kullanır",
  "Her rol kendi yetki seviyesine göre farklı sayfaları görür"
]);

// 5. Özellikler
contentSlide("Temel Özellikler", [
  "Anlık mesajlaşma (Socket.IO ile gerçek zamanlı)",
  "Şirket haberleri ve duyurular",
  "Eğitim modülü (kurs ve içerikler)",
  "Anket sistemi",
  "Bildirim sistemi (anlık push)",
  "Profil yönetimi ve dosya yükleme"
]);

// 6. Teknolojiler
contentSlide("Kullanılan Teknolojiler", [
  "Backend: Node.js + Express + Prisma ORM",
  "Veritabanı: MySQL 8",
  "Gerçek zamanlı: Socket.IO",
  "Frontend: React 19 + Vite",
  "Stil: Tailwind CSS v4",
  "Yönlendirme: React Router v7"
]);

// 7. Mimari
contentSlide("Mimari Yapı", [
  "Backend katmanları: routes → validations → controllers → Prisma",
  "JWT tabanlı kimlik doğrulama (15 dk access + 7 gün refresh)",
  "Şifreler bcrypt ile hash'leniyor",
  "Helmet + CORS + dosya tipi whitelist ile güvenlik",
  "Frontend tarafında Context API ile state yönetimi"
]);

// 8. Güvenlik
contentSlide("Güvenlik Önlemleri", [
  "JWT token tabanlı oturum yönetimi",
  "Bcrypt ile şifre hashleme (10 round)",
  "Rol bazlı erişim kontrolü (role middleware)",
  "Auth endpoint'lerinde rate limit (15 dk / 10 deneme)",
  "Dosya yüklemede 10MB limit + MIME whitelist",
  "Tüm yazma işlemleri için activity log (audit trail)"
]);

// 9. Demo
contentSlide("Demo Akışı", [
  "1. Giriş ekranı ve kayıt",
  "2. Dashboard — günlük özet",
  "3. Mesajlaşma — gerçek zamanlı sohbet",
  "4. Haberler ve duyurular",
  "5. SuperAdmin paneli (yönetici görünümü)"
]);

// 10. Kapanış
const last = pptx.addSlide();
last.background = { color: PRIMARY };
last.addText("Teşekkürler!", {
  x: 0.5, y: 2.5, w: 12, h: 1.5,
  fontSize: 60, bold: true, color: "FFFFFF", align: "center", fontFace: "Calibri"
});
last.addText("Sorular?", {
  x: 0.5, y: 4.0, w: 12, h: 0.8,
  fontSize: 28, color: "DDE7F2", align: "center", fontFace: "Calibri"
});

pptx.writeFile({ fileName: "CorpConnect_Sunum.pptx" }).then(name => {
  console.log("Oluşturuldu:", name);
});

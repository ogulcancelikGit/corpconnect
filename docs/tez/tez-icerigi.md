# CorpConnect Bitirme Tezi — Word'e Aktarım Notları

Bu dosyayı Word'e kopyaladıktan sonra:
- **# Başlık** → Heading 1 (18 pt, TAMAMI BÜYÜK)
- **## Başlık** → Heading 2 (12 pt, İlk Harf Büyük)
- **### Başlık** → Heading 3 (12 pt, İlk Harf Büyük)
- Paragraflar **0,5 cm asılı girinti** (Paragraf → Özel → İlk Satır → 0,5)
- Şekil başlıkları **altta**, **10 pt**, ortalı
- Tablo başlıkları **üstte**, **10 pt**, sola dayalı

Şablondaki *İngilizce + Türkçe açıklama* ikilisi rehber içindi; tez tek dilde yazılır — Türkçe seçildi.

Yer tutucular: `[ADINIZ SOYADINIZ]`, `[DANIŞMAN UNVANI VE ADI]`, `[AY YIL]` — kapakta değiştirilecek.

---

# KAPAK SAYFASI

UYGULAMALI BİLİMLER FAKÜLTESİ
BİLGİ SİSTEMLERİ VE TEKNOLOJİLERİ

KURUMSAL İLETİŞİM VE ÇALIŞAN YÖNETİM PLATFORMU: CORPCONNECT

BİTİRME PROJESİ
[ADINIZ SOYADINIZ]

[AY YIL]

---

# İÇ KAPAK

UYGULAMALI BİLİMLER FAKÜLTESİ
BİLGİ SİSTEMLERİ VE TEKNOLOJİLERİ

KURUMSAL İLETİŞİM VE ÇALIŞAN YÖNETİM PLATFORMU: CORPCONNECT

BİTİRME PROJESİ
[ADINIZ SOYADINIZ]

Lisans derecesini karşılamak amacıyla hazırlanmıştır.

Danışman:
[DANIŞMAN UNVANI VE ADI]

[AY YIL]

---

# İÇİNDEKİLER

> Bu sayfayı Word'de **Başvurular → İçindekiler Tablosu → Özel İçindekiler Tablosu** ile otomatik oluşturun. Aşağıdaki örnek liste rehber içindir.

ŞEKİLLER LİSTESİ
TABLOLAR LİSTESİ
KISALTMALAR LİSTESİ
ÖZET ............................................................................................................................. v
TEŞEKKÜR ................................................................................................................... vi

1. GİRİŞ ......................................................................................................................... 1
2. LİTERATÜR ARAŞTIRMASI ................................................................................... 2
3. SİSTEM TASARIMI VE TEKNOLOJİ ALTYAPISI ................................................. 4

   3.1. Sistem Mimarisi
   3.2. Sunucu Tarafı Teknolojiler
   3.3. İstemci Tarafı Teknolojiler
   3.4. Veri Modeli
   3.5. Güvenlik ve Yetkilendirme

4. UYGULAMA GELİŞTİRME VE ÖZELLİKLERİ
   4.1. Kullanıcı Yönetimi ve Roller
   4.2. İletişim Modülleri
   4.3. İş Süreci Modülleri
   4.4. Bilgi ve Sosyal Modüller
   4.5. Yönetim Paneli

5. SONUÇ VE ÖNERİLER
KAYNAKLAR
EKLER

---

# ŞEKİLLER LİSTESİ

Şekil 3.1 CorpConnect Üç Katmanlı Sistem Mimarisi ................................................. 5
Şekil 3.2 Veri Modeli İlişki Diyagramı (ER) ............................................................... 9
Şekil 4.1 Giriş ve Yetkilendirme Akışı ...................................................................... 14
Şekil 4.2 Görev Kanban Panosu Ekran Görüntüsü .................................................... 20
Şekil 4.3 Mesajlaşma Modülü Genel Görünümü ...................................................... 23

> Şekiller, atıfta bulunulduğu paragrafın altına yerleştirilir. Başlık şeklin altında, **10 pt** ve şekille birlikte ortalı yazılır. Numaralandırma Word'ün **Başvurular → Resim Yazısı Ekle** menüsünden yapılır.

---

# TABLOLAR LİSTESİ

Tablo 3.1 Sunucu Tarafı Teknoloji Yığını .................................................................... 6
Tablo 3.2 İstemci Tarafı Teknoloji Yığını ................................................................... 7
Tablo 3.3 Veri Tabanı Tabloları Özeti ........................................................................ 10
Tablo 4.1 Rol Tabanlı Yetki Matrisi .......................................................................... 15
Tablo 4.2 Modül-Özellik Eşleştirmesi ....................................................................... 19

> Tablo başlıkları tabloların üzerine, **10 pt** ve sola dayalı yazılır. Tablolar da sola hizalı oluşturulur.

---

# KISALTMALAR LİSTESİ

| Kısaltma | Açılımı |
|----------|---------|
| API | Application Programming Interface (Uygulama Programlama Arayüzü) |
| BST | Bilgi Sistemleri ve Teknolojileri |
| CORS | Cross-Origin Resource Sharing |
| CRUD | Create, Read, Update, Delete |
| CSP | Content Security Policy |
| ER | Entity-Relationship (Varlık-İlişki) |
| HMR | Hot Module Replacement |
| HTTP | Hypertext Transfer Protocol |
| HTTPS | Hypertext Transfer Protocol Secure |
| JWT | JSON Web Token |
| KVKK | Kişisel Verilerin Korunması Kanunu |
| MVC | Model-View-Controller |
| ORM | Object-Relational Mapping |
| REST | Representational State Transfer |
| SPA | Single Page Application |
| SQL | Structured Query Language |
| UI/UX | User Interface / User Experience |
| XSS | Cross-Site Scripting |

> Word'de tablo kenarlıkları kaldırılarak yerleştirilecek. Her kısaltma ayrı satırda. 12 pt.

---

# ÖZET

KURUMSAL İLETİŞİM VE ÇALIŞAN YÖNETİM PLATFORMU: CORPCONNECT

Günümüzde şirketler, çalışanlar arası iletişimi, iş akışı takibini ve kurumsal bilgi paylaşımını dijital ortamda yürütmek zorundadır. Pazardaki mevcut çözümler genellikle yalnızca mesajlaşma, yalnızca görev yönetimi ya da yalnızca insan kaynakları işlemleri gibi tek bir ihtiyaca odaklanmakta; kurumların farklı araçları bir arada kullanmasına neden olmaktadır. Bu durum hem maliyet hem de verimlilik açısından dezavantaj yaratmaktadır. Bu çalışma kapsamında geliştirilen **CorpConnect**, anlık mesajlaşma, görev atama ve takibi, izin başvurusu ve onay süreçleri, masraf yönetimi, kurumsal haberler, anketler, eğitim materyalleri, takvim, öneri sistemi ve özel günler kutlama gibi modülleri tek bir web tabanlı platformda bir araya getirmektedir. Sunucu tarafında Node.js, Express, Prisma ORM ve MySQL; istemci tarafında React 19, Vite ve Tailwind CSS teknolojileri kullanılmıştır. Gerçek zamanlı iletişim Socket.IO ile sağlanmış; kimlik doğrulama JSON Web Token tabanlı kısa ömürlü erişim ve uzun ömürlü yenileme jetonu çifti ile yürütülmüştür. Sistemde üç rol (Yönetici, Bölüm Yöneticisi, Çalışan) tanımlanmış ve rol tabanlı yetkilendirme uygulanmıştır. Çalışmanın sonucunda, küçük ve orta ölçekli işletmelerin tek bir noktadan iletişim ve süreç yönetimi yapabileceği, modüler ve genişletilebilir bir kurumsal intranet platformu ortaya konmuştur.

**Anahtar Kelimeler:** Kurumsal İntranet, Tam Yığın Web Geliştirme, Gerçek Zamanlı İletişim, Görev Yönetimi, Rol Tabanlı Yetkilendirme.

> Kelime sayısı kontrolü: yukarıdaki paragraf yaklaşık **215 kelime** — sınır içinde (150–300). Anahtar kelime sayısı: 5. Paragraf başlarken **0,5 cm girinti**.

---

# TEŞEKKÜR

Bu projenin geliştirilmesi sürecinde değerli rehberliğini, eleştirilerini ve yönlendirmelerini esirgemeyen danışmanım [DANIŞMAN UNVANI VE ADI]'ya teşekkürlerimi sunarım. Lisans eğitimim boyunca akademik ve mesleki gelişimime katkıda bulunan tüm bölüm hocalarıma minnettarım. Çalışmanın hazırlık ve test aşamalarında geri bildirimleriyle destek olan arkadaşlarıma ve her aşamada yanımda olan aileme şükranlarımı iletirim.

> Teşekkür bölümü opsiyoneldir. İstenmiyorsa silinebilir.

---

# 1. GİRİŞ

Bilgi ve iletişim teknolojilerinin iş dünyasındaki etkisi her geçen gün artmakta; özellikle pandemi sonrası hibrit ve uzaktan çalışma modelleri yaygınlaştıkça, çalışanlar arası iletişimin ve iş akışlarının dijital platformlar üzerinden yürütülmesi zorunlu hâle gelmiştir. Şirketler bu süreçte e-posta, anlık mesajlaşma uygulamaları, görev takip sistemleri, izin yönetim yazılımları gibi birden fazla aracı bir arada kullanmak durumunda kalmakta; bu durum hem lisans maliyetlerini artırmakta hem de bilgi bütünlüğünün korunmasını güçleştirmektedir.

Bu çalışmanın amacı, küçük ve orta ölçekli işletmelerin (KOBİ) ihtiyaç duyduğu farklı modülleri tek bir kurumsal intranet platformunda toplayan, modern web teknolojileriyle geliştirilmiş, modüler ve ölçeklenebilir bir uygulama ortaya koymaktır. Geliştirilen platform; anlık mesajlaşma, görev yönetimi, izin ve masraf başvurusu, kurumsal haberler, anketler, eğitim, takvim ve sosyal modüller (öneri kutusu, doğum günü ve yıl dönümü kutlamaları) gibi farklı iş ihtiyaçlarını tek bir merkezde sunmayı hedeflemektedir.

Konunun seçilmesindeki temel motivasyonlar şu şekilde özetlenebilir: (i) pazarda bütünleşik çözümlerin çoğunluğunun yabancı menşeli olması ve Türkçe dil desteğinin ikincil planda kalması, (ii) KOBİ ölçeğindeki kurumlar için bu çözümlerin lisans maliyetlerinin yüksek olması, (iii) farklı araçlar arasında bilgi parçalanmasının yarattığı verimlilik kaybı. Geliştirilen platform, açık kaynaklı bir mimari üzerinde Türkçe arayüzle sunularak bu eksiklikleri gidermeyi amaçlamaktadır.

Bu projenin bilişim teknolojileri alanına katkıları arasında; tam yığın (full-stack) bir web uygulamasının üç katmanlı mimaride nasıl tasarlanabileceğine dair pratik bir örnek sunması, gerçek zamanlı iletişim için WebSocket tabanlı bir akışın nasıl entegre edildiğini göstermesi ve rol tabanlı yetkilendirmenin (RBAC) modüler bir intranet üzerinde nasıl uygulanabileceğine dair somut bir referans sağlaması yer almaktadır.

Çalışmanın bundan sonraki bölümleri şu şekilde organize edilmiştir: **İkinci bölümde** sektörde kullanılan benzer ürünler ve akademik çalışmalar incelenmiş; CorpConnect'in mevcut çözümlerden farklı yönleri ortaya konmuştur. **Üçüncü bölümde** sistemin tasarım kararları, kullanılan teknoloji yığını, veri modeli ve güvenlik mekanizmaları anlatılmıştır. **Dördüncü bölümde** platformun modülleri, ekran akışları ve geliştirme süreçleri detaylandırılmıştır. **Beşinci bölümde** elde edilen sonuçlar değerlendirilmiş, projenin sınırlamaları ve gelecekte yapılabilecek geliştirmelere yönelik öneriler sunulmuştur.

---

# 2. LİTERATÜR ARAŞTIRMASI

Kurumsal iletişim ve çalışan yönetim platformları, yaklaşık on beş yıldır hem akademik çevrelerin hem de sektör oyuncularının ilgisini çeken bir alandır. Bu bölümde önce sektörde yaygın kullanılan ürünler incelenmiş, ardından akademik kaynaklardan elde edilen bulgular özetlenmiş ve son olarak CorpConnect'in bu yelpazedeki konumu açıklanmıştır.

## 2.1. Sektörel Mevcut Çözümler

**Microsoft Teams** ve **Slack**, anlık mesajlaşma ve sesli/görüntülü iletişim odaklı, kurumsal kanal yapısı üzerine kurulu çözümlerdir. Her ikisi de zengin entegrasyon ekosistemine sahip olmakla birlikte, görev yönetimi ve insan kaynakları süreçleri yalnızca üçüncü taraf uygulamalar üzerinden eklenebilmektedir. **Workplace by Meta** (2024 yılında durdurulmuştur), Facebook benzeri sosyal akış mantığını kuruma taşımış; ancak iş süreçleri yönetimi konusunda sınırlı kalmıştır. **Asana** ve **Trello** ise yalnızca görev/proje yönetimi alanında uzmanlaşmış olup iletişim, izin ve masraf gibi konuları kapsamamaktadır. Türkiye pazarında **Mobilyaka** ve benzeri intranet çözümleri; haberler, organizasyon şeması ve duyuru gibi temel ihtiyaçları karşılamakla birlikte modüler genişlemeye sınırlı imkân sunmaktadır.

## 2.2. Akademik Çalışmalar

İlgili akademik literatürde, kurumsal sosyal yazılım kavramı (Enterprise Social Software) çalışan bağlılığı, bilgi paylaşımı ve örgüt içi iletişim üzerindeki etkileri bağlamında ele alınmaktadır. Leonardi ve arkadaşları (2013), kurumsal sosyal platformların bilgi görünürlüğünü artırarak çalışanlar arası iş birliğini geliştirdiğini ortaya koymuştur. Pirkkalainen ve Pawlowski (2014), çok modüllü kurumsal yazılımların kullanıcı kabulüne ilişkin başarı faktörlerini incelemiş; kullanım kolaylığı, mobil erişilebilirlik ve süreç entegrasyonunu öncelikli unsurlar olarak belirlemiştir. Daha güncel çalışmalarda ise gerçek zamanlı iletişim altyapıları için **WebSocket** ve **Socket.IO** tabanlı uygulamaların performans avantajları, HTTP yoklama (polling) yöntemine kıyasla detaylı biçimde tartışılmaktadır.

## 2.3. CorpConnect'in Özgün Yönleri

Yukarıdaki ürün ve çalışmalar incelendiğinde, CorpConnect'i ayırt eden başlıca özellikler şu şekilde özetlenebilir:

- **Bütünleşik yapı:** İletişim, görev, izin, masraf, takvim, öneri, eğitim ve kutlama gibi farklı ihtiyaçları tek platformda toplaması.
- **Türkçe öncelikli arayüz:** Tüm kullanıcıya görünür metinler, hata mesajları ve bildirim içerikleri Türkçe tasarlanmıştır.
- **Açık kaynaklı modern yığın:** Node.js, React 19, Prisma ORM ve MySQL gibi yaygın, ücretsiz ve sürdürülebilir teknolojiler üzerine kuruludur.
- **Rol tabanlı modüler yetkilendirme:** Yönetici, Bölüm Yöneticisi ve Çalışan olmak üzere üç rol arasında ince taneli yetki ayrımı yapılmıştır.
- **Aktivite günlüğü (audit trail):** Tüm yazma işlemleri, denetim izi oluşturacak şekilde merkezi olarak loglanmaktadır.

Bu yönleriyle CorpConnect; sektörde yaygın olan tek odaklı çözümlere alternatif sunan, KOBİ ölçeğine uygun ve genişletilebilir bir referans uygulama olarak konumlanmaktadır.

---

# 3. SİSTEM TASARIMI VE TEKNOLOJİ ALTYAPISI

Bu bölümde CorpConnect'in tasarım kararları, üç katmanlı mimari yaklaşımı, sunucu ve istemci tarafında kullanılan teknolojiler, veri modeli ve güvenlik mekanizmaları ele alınmaktadır.

## 3.1. Sistem Mimarisi

CorpConnect, klasik üç katmanlı (3-tier) mimari üzerine kuruludur:

1. **Sunum Katmanı (İstemci):** React 19 ile geliştirilmiş tek sayfa uygulaması (Single Page Application — SPA). Tarayıcıda çalışır, kullanıcıya Türkçe arayüz sunar.
2. **Uygulama Katmanı (Sunucu):** Node.js üzerinde Express çerçevesi ile yazılmış REST API. İş kurallarını yürütür, kimlik doğrular, gerçek zamanlı bildirimleri Socket.IO üzerinden yayar.
3. **Veri Katmanı:** MySQL 8 ilişkisel veri tabanı. Prisma ORM ile uygulama tarafından şema güvenli biçimde sorgulanır.

Katmanlar arası iletişim, REST API uçları (HTTP) ve gerçek zamanlı olaylar için WebSocket (Socket.IO) üzerinden gerçekleştirilir. İstemci ile sunucu farklı bağlantı noktalarında çalışır; geliştirme ortamında Vite tarafındaki `proxy` ayarı sayesinde CORS sorunsuz yönlendirilir, üretim ortamında ise istemci derlemesi statik olarak sunulabilir.

**Şekil 3.1 CorpConnect Üç Katmanlı Sistem Mimarisi**

> Word'e şekil eklenecek alan. Diyagramda Tarayıcı (React) → Express API → MySQL kutuları ve Socket.IO çift yönlü oku gösterilmelidir.

Sunucu tarafında klasik **MVC** kalıbına benzer bir katmanlı dosya yapısı izlenmiştir:

- `routes/` — HTTP uç noktası tanımları
- `validations/` — express-validator ile istek doğrulama zincirleri
- `controllers/` — iş kuralları ve Prisma çağrıları
- `middleware/` — kimlik doğrulama, yetki, doğrulama, dosya yükleme, global hata yakalama
- `utils/` — sayfalama, JWT, bcrypt, yanıt zarfı (envelope), aktivite günlüğü yardımcıları
- `config/` — CORS, Helmet, multer, Socket.IO yapılandırmaları
- `socket/handlers/` — gerçek zamanlı olay işleyicileri

İstemci tarafında ise sayfalar `pages/`, ortak bileşenler `components/`, API çağrıları `services/`, küresel durum yönetimi `context/`, doğrulama şemaları `schemas/` altında organize edilmiştir.

## 3.2. Sunucu Tarafı Teknolojiler

Sunucu katmanında tercih edilen teknolojiler ve seçim gerekçeleri Tablo 3.1'de özetlenmiştir.

**Tablo 3.1 Sunucu Tarafı Teknoloji Yığını**

| Teknoloji | Sürüm | Rolü |
|---|---|---|
| Node.js | 24.12 | JavaScript çalışma zamanı |
| Express | 4.18 | HTTP yönlendirme ve ara yazılım çerçevesi |
| Prisma ORM | 5.22 | Veri tabanı erişim katmanı, şema göçleri |
| MySQL | 8.0 | İlişkisel veri tabanı yönetim sistemi |
| Socket.IO | 4.6 | Gerçek zamanlı iletişim (WebSocket) |
| jsonwebtoken | 9.0 | JSON Web Token üretimi ve doğrulama |
| bcryptjs | 2.4 | Parola özetleme (hashing) |
| Helmet | 7.0 | Güvenlik başlıkları (CSP, HSTS) |
| multer | 1.4 | Çok parçalı dosya yükleme |
| Winston | 3.19 | Yapılandırılabilir günlükleme |
| express-rate-limit | 7.0 | İstek hızı sınırlandırma |

Node.js, olay döngüsü tabanlı, eşzamansız ve tek iş parçacıklı çalışma modeliyle çok sayıda eşzamanlı bağlantıyı verimli karşılayabilmektedir. Bu özellik, mesajlaşma ve bildirim gibi sürekli açık bağlantılar gerektiren senaryolarda belirleyici olmuştur. Express, minimalist yapısı ve geniş ekosistemiyle hızlı uç nokta geliştirmeye olanak sağlamaktadır. Prisma, geleneksel SQL yazımı yerine güvenli ve tip dostu sorgu yöntemleri sunarak geliştirici verimliliğini artırmaktadır.

## 3.3. İstemci Tarafı Teknolojiler

İstemci tarafında React 19 sürümü temel alınmış, modern derleme aracı olarak Vite tercih edilmiştir. Stil yönetimi için utility-first yaklaşımıyla Tailwind CSS v4 kullanılmıştır.

**Tablo 3.2 İstemci Tarafı Teknoloji Yığını**

| Teknoloji | Sürüm | Rolü |
|---|---|---|
| React | 19.x | Bileşen tabanlı UI kütüphanesi |
| Vite | 5.x | Geliştirme sunucusu ve modül paketleyici |
| react-router | 7.x | İstemci tarafı yönlendirme |
| Tailwind CSS | 4.x | Utility-first stil çerçevesi |
| axios | — | HTTP istemcisi (interceptor destekli) |
| react-hook-form | — | Form durumu yönetimi |
| Zod | — | Şema tabanlı doğrulama |
| date-fns | — | Tarih biçimlendirme (Türkçe yerel ayar) |
| lucide-react | — | İkon kütüphanesi |
| react-hot-toast | — | Bildirim mesajları |
| socket.io-client | — | Gerçek zamanlı istemci |

Vite'ın Hot Module Replacement (HMR) özelliği, geliştirme döngüsünü hızlandırmıştır. Tailwind CSS'in utility-first yaklaşımı, ortak bir tasarım dilini koruyarak özel CSS yazımını en aza indirmiştir. React Router'ın iç içe rota desteği sayesinde, normal kullanıcı ve süper yönetici için iki ayrı yerleşim (layout) ağacı net biçimde ayrılmıştır.

## 3.4. Veri Modeli

CorpConnect veri modeli; kullanıcı, iletişim, iş süreci, sosyal etkileşim ve yönetim olmak üzere beş ana grupta toplanmıştır. Veri tabanı şeması Prisma'nın bildirimsel `schema.prisma` dosyasında tek bir noktada tanımlanmış ve göç (migration) dosyaları aracılığıyla sürüm kontrolüne alınmıştır.

**Şekil 3.2 Veri Modeli İlişki Diyagramı (ER)**

> Word'e ER diyagramı eklenecek alan. Ana varlıklar: User, UserProfile, Conversation, Message, Task, TaskComment, LeaveRequest, Expense, CalendarEvent, Suggestion, Notification, ActivityLog.

**Tablo 3.3 Veri Tabanı Tabloları Özeti**

| Grup | Tablolar | Kısa Açıklama |
|---|---|---|
| Kullanıcı | users, user_profiles, refresh_tokens, password_resets | Kimlik, profil, oturum yönetimi |
| İletişim | conversations, conversation_members, messages | Bire bir ve grup mesajlaşma |
| Bildirim | notifications, notification_preferences | Anlık bildirimler, kullanıcı tercihleri |
| Görev | tasks, task_comments | Görev oluşturma, atama, yorumlama |
| İzin | leave_requests | İzin başvurusu ve onay akışı |
| Masraf | expenses | Masraf bildirimi ve onay |
| Takvim | calendar_events, event_attendees | Etkinlik ve katılımcı yönetimi |
| Bilgi | news, polls, poll_votes, trainings | Haber, anket, eğitim |
| Sosyal | suggestions, celebrations | Öneri kutusu, kutlamalar |
| Yönetim | activity_logs, system_settings | Denetim izi, sistem ayarları |

### 3.4.1. Temel Varlıklar Arası İlişkiler

`User` varlığı sistemin merkezindedir; oluşturduğu ve atandığı görevler (`createdTasks`, `assignedTasks`), gönderdiği mesajlar (`sentMessages`), izin başvuruları (`leaveRequests`), masraf kayıtları (`expenses`) ve aktivite günlüğü (`activityLogs`) gibi pek çok ilişki üzerinden diğer varlıklara bağlanır. `Conversation` ile `User` arasındaki bağlantı bir ara tablo olan `ConversationMember` üzerinden çoka çok kurulmuştur; bu sayede hem bire bir hem de grup sohbetleri tek bir yapı içinde modellenebilmiştir. Tüm yazma işlemleri `ActivityLog` tablosuna düşürülerek denetim izi (audit trail) oluşturulur.

## 3.5. Güvenlik ve Yetkilendirme

CorpConnect tasarımında güvenlik, mimarinin yan ürünü değil, baştan dikkate alınan bir kalite niteliği olarak ele alınmıştır.

### 3.5.1. Kimlik Doğrulama

Kimlik doğrulama, JSON Web Token (JWT) tabanlı iki jeton yaklaşımıyla yürütülmektedir:

- **Erişim Jetonu (Access Token):** Kısa ömürlü (15 dakika), her HTTP isteğinde `Authorization` başlığında taşınır.
- **Yenileme Jetonu (Refresh Token):** Uzun ömürlü (7 gün), erişim jetonunun süresi dolduğunda yeni jeton üretmek için kullanılır ve veri tabanında saklanır.

Parolalar, bcrypt algoritmasıyla 10 round üzerinden özetlenerek saklanır. Düz metin parolalar veya geri döndürülebilir şifreleme tercih edilmemiştir.

### 3.5.2. Yetkilendirme

Sistemde üç rol bulunmaktadır:

**Tablo 4.1 Rol Tabanlı Yetki Matrisi** *(bu tabloya 4. Bölümde tekrar atıfta bulunulacaktır)*

| Yetenek | Yönetici (ADMIN) | Bölüm Yöneticisi (MANAGER) | Çalışan (EMPLOYEE) |
|---|:---:|:---:|:---:|
| Süper yönetici paneline erişim | ✔ | ✘ | ✘ |
| Kullanıcı yönetimi | ✔ | ✘ | ✘ |
| Sistem ayarlarını değiştirme | ✔ | ✘ | ✘ |
| İzin başvurusu onaylama | ✔ | ✔ | ✘ |
| Masraf onaylama | ✔ | ✔ | ✘ |
| Görev oluşturma ve atama | ✔ | ✔ | ✔ |
| Mesajlaşma | ✘* | ✔ | ✔ |
| Haber, duyuru, anket oluşturma | ✔ | ✔ | ✘ |

*Yönetici rolü yalnızca sistem izleme amaçlı tasarlandığından kullanıcı listelerinde gizlenir.*

Yetki denetimi, sunucu tarafında `auth.middleware` (kimlik doğrulama) ve `role.middleware` (rol kontrolü) ara katmanları aracılığıyla uçtan uca uygulanmaktadır.

### 3.5.3. Veri Güvenliği ve İletişim

- **CORS:** Yalnızca tanımlı istemci kaynağına izin verilir.
- **Helmet:** Tarayıcı güvenlik başlıkları (Content Security Policy, HTTP Strict Transport Security vb.) otomatik olarak eklenir.
- **Hız Sınırlandırma:** `/auth` uç noktalarına 15 dakikada 10 deneme sınırı uygulanmıştır.
- **Dosya Yükleme:** Multer ile en fazla 10 MB ve yalnızca izin verilen MIME türleri kabul edilmektedir.
- **Girdi Doğrulama:** express-validator zincirleri her yazma uç noktasında çalıştırılır.

---

# 4. UYGULAMA GELİŞTİRME VE ÖZELLİKLERİ

Bu bölümde CorpConnect platformunun modülleri, kullanım akışları ve geliştirme sırasında alınan önemli kararlar ele alınmaktadır.

## 4.1. Kullanıcı Yönetimi ve Roller

Kullanıcı modeli; e-posta, parola, ad, soyad, rol, etkinlik durumu ve profile ait genişletme alanları (bölüm, pozisyon, avatar, telefon, biyografi, doğum tarihi, işe giriş tarihi) içermektedir. Profil bilgileri, kullanıcıyı bir bütün olarak temsil edebilmek amacıyla ayrı bir tabloda `UserProfile` olarak tutulmuş ve tek-bire-tek ilişkiyle bağlanmıştır.

### 4.1.1. Giriş, Çıkış ve Parola Sıfırlama

Giriş akışı, e-posta ve parolanın doğrulanmasının ardından erişim ve yenileme jeton çiftinin döndürülmesiyle tamamlanır. Parola sıfırlama işlemi, kullanıcıya benzersiz bir kod gönderilmesi ve bu kodla yeni parolanın belirlenmesi şeklinde iki adımda yürütülür.

**Şekil 4.1 Giriş ve Yetkilendirme Akışı**

> Word'e dizi diyagramı (sequence) eklenecek alan: İstemci → Sunucu (kimlik doğrulama) → Sunucu (jeton döndürme) → İstemci (yerel depolama).

### 4.1.2. Rol Tabanlı Yönlendirme

İstemci tarafında `ProtectedRoute` bileşeni; oturum durumu ve rol bilgisine bakarak rotalara erişimi denetler. Yönetici rolündeki kullanıcılar girişin ardından otomatik olarak `/superadmin` köküne yönlendirilir; diğer roller `/` altındaki normal yerleşime düşer.

## 4.2. İletişim Modülleri

### 4.2.1. Mesajlaşma

Mesajlaşma modülü, bire bir ve grup sohbetlerini tek bir veri yapısı altında modellemektedir. `Conversation` varlığı; sohbet türünü, başlığını ve oluşturucu bilgisini içerirken, `ConversationMember` ara tablosu hem üyeleri hem de kullanıcıya özel ayarları (sessize alma, sabitleme, arşivleme, son okuma) tutar. `Message` varlığı ise metin, dosya eki, yanıt verilen mesaj, etiketlenen kullanıcılar ve tepki ilişkilerini taşır.

Kullanıcı seçimi, mesajlaşma akışında ortak bir desen olarak avatar + ad + departman·pozisyon biçiminde dikey liste olarak sunulmuştur. Arama kutusunda yazılan metin 350 ms gecikmeyle (debounce) sunucuya iletilerek gereksiz istek sayısı azaltılmıştır.

**Şekil 4.3 Mesajlaşma Modülü Genel Görünümü**

> Word'e ekran görüntüsü eklenecek alan.

### 4.2.2. Bildirim

`Notification` varlığı; alıcı kullanıcı, başlık, gövde, tür (görev, izin, mesaj vb.) ve bağlantı (link) bilgilerini içerir. Her kullanıcı, `NotificationPreference` tablosu üzerinden bildirim türlerini bireysel olarak açıp kapatabilir. Bildirimler hem REST uç noktası üzerinden geçmişe dönük olarak listelenir hem de Socket.IO üzerinden anlık olarak istemciye iletilir.

## 4.3. İş Süreci Modülleri

### 4.3.1. Görev Yönetimi

Görev modülü, klasik Kanban panosu (Yapılacak → Devam Ediyor → Tamamlandı → İptal) üzerine kuruludur. Her görev başlık, açıklama, öncelik (Düşük, Normal, Yüksek, Acil), durum, son tarih ve atanan kullanıcı bilgilerini içerir.

**Şekil 4.2 Görev Kanban Panosu Ekran Görüntüsü**

> Word'e ekran görüntüsü eklenecek alan.

Görev detay sayfası; açıklama, durum hızlı geçiş düğmeleri, yorum dizisi (`TaskComment`) ve aktivite tarihçesi (`ActivityLog` üzerinden besleniyor) olmak üzere iki sütunlu bir düzende tasarlanmıştır. Atama bileşeni, mesajlaşmadaki kullanıcı seçim desenine benzer şekilde avatar ve departman bilgisiyle birlikte aranabilir bir popover olarak uygulanmıştır. Sistem yöneticisi (ADMIN) rolü, atanabilir kullanıcı listesinden dışlanmıştır.

### 4.3.2. İzin Yönetimi

`LeaveRequest` varlığı; izin türü (yıllık, hastalık, mazeret, ücretsiz), başlangıç ve bitiş tarihleri, durum (Beklemede, Onaylandı, Reddedildi, İptal), inceleyen kişi ve inceleme notu alanlarını içerir. Çalışan başvuruyu oluşturur; ilgili bölüm yöneticisi veya sistem yöneticisi onaylar ya da reddeder. Onay durumunda kullanıcıya bildirim gider.

### 4.3.3. Masraf Yönetimi

`Expense` varlığı; başlık, açıklama, tutar, döviz, harcama tarihi, fiş eki, durum ve inceleyen kullanıcı alanlarını içerir. Fişler, dosya yükleme modülü (`File`) ile ilişkilendirilir. Onay akışı izin başvurusuyla aynı desende uygulanmıştır.

## 4.4. Bilgi ve Sosyal Modüller

### 4.4.1. Haberler ve Duyurular

`News` varlığı; başlık, içerik, kategori, kapak görseli, yayın durumu ve yayınlanma tarihi alanlarını içerir. Yöneticiler ve bölüm yöneticileri yeni haber oluşturabilir; çalışanlar yalnızca yayınlanmış olanları okuyabilir.

### 4.4.2. Anketler

`Poll` ve `PollOption` varlıkları, çok seçenekli anketleri modellemektedir. Her kullanıcı bir ankete yalnızca bir kez oy verebilir; oylar `PollVote` tablosunda saklanır.

### 4.4.3. Eğitim

`Training` varlığı; eğitim başlığı, açıklaması, materyal bağlantısı (video veya doküman) ve katılım durumu alanlarını içerir. Çalışanlar kendilerine atanan eğitim materyallerini inceleyebilir.

### 4.4.4. Takvim

`CalendarEvent` ve `EventAttendee` varlıkları; etkinlik başlığı, türü (toplantı, doğum günü, eğitim, tatil), başlangıç ve bitiş zamanı, konum, çevrim içi bağlantı, organizatör ve katılımcı listesi gibi alanları içerir. Katılımcı durumu (Katılacak, Belki, Katılmayacak) ayrı bir alanda tutulur.

### 4.4.5. Öneri Kutusu

`Suggestion` varlığı; başlık, içerik, kategori, durum, anonim olma seçeneği ve yönetici notu alanlarını içerir. Çalışanlar kurumsal süreçlere ilişkin önerilerini iletebilir; öneriler yöneticiler tarafından incelenir.

### 4.4.6. Kutlamalar

Doğum günü ve işe giriş yıl dönümleri gibi özel günler, ana sayfada `Celebration` modülü üzerinden vurgulanır. Bu sayede çalışan bağlılığı ve sosyal etkileşim güçlendirilir.

## 4.5. Yönetim Paneli

Yönetici rolüne özel `/superadmin` yerleşimi; sistem genelinin sayısal göstergelerinin sunulduğu **Genel Bakış**, kullanıcı yönetimi (`Users`), izin onayları (`Leaves`), masraf onayları (`Expenses`), aktivite günlüğü (`Logs`), raporlar (`Reports`), öneri yönetimi (`Suggestions`), kurumsal duyuru (`Broadcast`) ve sistem ayarları (`Settings`) sayfalarını barındırır. Yan menü yapısı, normal kullanıcı yerleşiminden ayrı tutularak bilişsel yükün düşürülmesi hedeflenmiştir.

**Tablo 4.2 Modül-Özellik Eşleştirmesi**

| Modül | Anahtar Özellikler |
|---|---|
| Kimlik Yönetimi | JWT, parola sıfırlama, oturum yenileme |
| Mesajlaşma | Bire bir + grup, dosya eki, tepki, etiketleme, arşiv |
| Bildirim | Tür bazlı tercih, gerçek zamanlı dağıtım |
| Görev | Kanban, atama, yorum, aktivite tarihçesi, son tarih uyarısı |
| İzin | Türlü başvuru, onay akışı, denge takibi |
| Masraf | Fiş yükleme, onay süreci, KDV alanı |
| Takvim | Etkinlik, katılımcı durumu, kategori filtresi |
| Haber/Anket/Eğitim | Yayın durumu, kategori, görüntülenme |
| Öneri/Kutlama | Anonim öneri, otomatik kutlama hatırlatması |
| Yönetim Paneli | Kullanıcı, log, rapor, ayar |

---

# 5. SONUÇ VE ÖNERİLER

Bu çalışma kapsamında, küçük ve orta ölçekli işletmelerin iletişim, iş takibi ve çalışan etkileşimi ihtiyaçlarını tek bir platformda karşılayabilen, modüler ve genişletilebilir bir kurumsal intranet uygulaması olan CorpConnect tasarlanmış ve geliştirilmiştir. Çalışmanın temel kazanımları aşağıdaki gibi özetlenebilir:

- Üç katmanlı bir mimari ile, sorumluluğu açıkça ayrılmış, sürdürülebilir bir kod tabanı ortaya konmuştur.
- JSON Web Token tabanlı kimlik doğrulama ile durum bilgisi tutmayan, yatay ölçeklenebilir bir sunucu altyapısı tasarlanmıştır.
- Rol tabanlı yetki ara katmanları sayesinde, modüllerin tamamı tek bir merkezden ince taneli denetlenebilmektedir.
- Socket.IO ile gerçek zamanlı mesajlaşma ve bildirim akışı, çalışanlar arası anlık etkileşimi mümkün kılmıştır.
- Tüm yazma işlemlerinin merkezi olarak kaydedildiği aktivite günlüğü, denetim izi (audit trail) gereksinimini karşılamaktadır.

Bilişim teknolojileri alanına katkı bağlamında, CorpConnect; Node.js + React 19 ekosisteminde tam yığın bir intranet uygulamasının nasıl tasarlanabileceğine dair somut bir referans sunmaktadır. Özellikle Türkçe öncelikli arayüz ve modüler büyümeye olanak sağlayan yapı, KOBİ ölçeğindeki kurumlar için sektörde yer alan yabancı çözümlere alternatif olarak değerlendirilebilir.

## 5.1. Çalışmanın Sınırları

Geliştirilen sistemin mevcut sürümü, akademik bir bitirme projesi kapsamında ortaya konmuştur ve aşağıdaki sınırlamalar göz önünde bulundurulmalıdır:

- **Test Kapsamı:** Otomatik birim ve bütünleşik testler henüz yazılmamıştır; doğrulama elle yapılan duman testleri (smoke test) ile sınırlı kalmıştır.
- **Mobil Uygulama:** Yalnızca duyarlı (responsive) web arayüzü mevcuttur; yerel iOS/Android uygulamaları geliştirilmemiştir.
- **Ölçeklenme:** Tek sunucu örneği ve tek MySQL eşgüdümünde test edilmiştir; yüksek eşzamanlı yük altında performans ölçümleri yapılmamıştır.
- **Uluslararasılaştırma:** Yalnızca Türkçe arayüz sunulmaktadır; çok dilli desteğin altyapısı oluşturulmamıştır.
- **Yapay Zekâ:** Akıllı öneri, otomatik özetleme veya doğal dil sorgulama gibi yapay zekâ destekli yetenekler kapsama alınmamıştır.

## 5.2. Gelecek Çalışmalar İçin Öneriler

Bu çalışma; aşağıdaki yönlerde geliştirilmeye uygun bir temel sunmaktadır:

1. **Otomatik Test Altyapısı:** Jest ve Supertest gibi araçlarla sunucu tarafı bütünleşik testlerin, Playwright veya Cypress ile uçtan uca testlerin eklenmesi.
2. **Mobil İstemci:** React Native tabanlı bir mobil uygulamanın geliştirilerek aynı API üzerinden hizmet alması.
3. **Yapay Zekâ Destekli Modüller:** Görev önerileri, e-posta veya mesaj özetleri, anonim duygu analizi gibi yetenekler için büyük dil modeli (LLM) entegrasyonu.
4. **KVKK Uyum Modülü:** Kişisel veri envanteri, açık rıza yönetimi ve veri silme talebi süreçlerinin sistemleştirilmesi.
5. **Mikroservis Geçişi:** Yüksek trafikli modüllerin (mesajlaşma, bildirim) bağımsız hizmetlere ayrılması ve mesaj kuyruğu (örn. RabbitMQ) ile bütünleştirilmesi.
6. **Çok Kiracılı (Multi-Tenant) Yapı:** Tek bir kurulum üzerinden birden fazla şirkete hizmet sunabilen SaaS modeline dönüştürme.
7. **Gelişmiş Analitik:** Yöneticilere çalışan bağlılığı, görev tamamlanma oranı ve etkileşim göstergeleri sunan gösterge tabloları.

Bu öneriler, CorpConnect'in akademik bir prototipten kurumsal bir ürüne evrilebilmesi için ihtiyaç duyulan adımları özetlemektedir.

> ÖNEMLİ NOT: Bu bölümün sonunda Word'de **Düzen → Kesmeler → Bölüm Sonu (Sonraki Sayfa)** eklenmelidir. Giriş, Literatür, Ana Bölümler ve Sonuç'un toplam sayfa sayısı 30–50 aralığında olmalıdır.

---

# KAYNAKLAR

> Bu bölümün biçimlendirmesinde **0,5 cm asılı girinti** (hanging indent) kullanılır: ilk satır 0 cm, sonraki satırlar 0,5 cm içeriden başlar. Word'de Paragraf → Özel → Asılı → 0,5.

Microsoft. (2025). *Microsoft Teams documentation*. Erişim adresi: https://learn.microsoft.com/microsoftteams/

Slack Technologies. (2025). *Slack platform documentation*. Erişim adresi: https://api.slack.com/

Meta Platforms. (2024). *Workplace transition announcement*. Erişim adresi: https://www.workplace.com/

Atlassian. (2025). *Trello & Jira Software resources*. Erişim adresi: https://www.atlassian.com/

Asana. (2025). *Asana developer documentation*. Erişim adresi: https://developers.asana.com/

Node.js Foundation. (2025). *Node.js documentation*. Erişim adresi: https://nodejs.org/docs/

OpenJS Foundation. (2025). *Express.js documentation*. Erişim adresi: https://expressjs.com/

Meta. (2025). *React documentation (v19)*. Erişim adresi: https://react.dev/

Vite Project. (2025). *Vite documentation*. Erişim adresi: https://vitejs.dev/

Prisma. (2025). *Prisma ORM documentation*. Erişim adresi: https://www.prisma.io/docs/

Tailwind Labs. (2025). *Tailwind CSS documentation (v4)*. Erişim adresi: https://tailwindcss.com/

Socket.IO Team. (2025). *Socket.IO documentation*. Erişim adresi: https://socket.io/docs/

Leonardi, P. M., Huysman, M., & Steinfield, C. (2013). Enterprise social media: Definition, history, and prospects for the study of social technologies in organizations. *Journal of Computer-Mediated Communication*, 19(1), 1–19.

Pirkkalainen, H., & Pawlowski, J. M. (2014). Global social knowledge management — understanding barriers for global workers utilizing social software. *Computers in Human Behavior*, 30, 637–647.

Riemer, K., & Tavakoli, A. (2013). The role of groups as local context in large enterprise social networks: A case study of Yammer at Deloitte Australia. *Business Information Systems Engineering*, 5(5), 327–340.

Treem, J. W., & Leonardi, P. M. (2012). Social media use in organizations: Exploring the affordances of visibility, editability, persistence, and association. *Communication Yearbook*, 36, 143–189.

Türkiye Cumhuriyeti. (2016). *6698 Sayılı Kişisel Verilerin Korunması Kanunu*. Resmi Gazete, 29677.

OWASP Foundation. (2021). *OWASP Top 10:2021*. Erişim adresi: https://owasp.org/Top10/

---

# EKLER

> Proje akışını bozan uzun tablo veya kod satırları bu bölüme yerleştirilir. Başlıklar büyük ve **kalın** olur.

## EK-1: VERİTABANI ENUM DEĞERLERİ

| Enum | Değerler |
|---|---|
| Role | ADMIN, MANAGER, EMPLOYEE |
| TaskPriority | LOW, NORMAL, HIGH, URGENT |
| TaskStatus | TODO, IN_PROGRESS, DONE, CANCELLED |
| LeaveType | ANNUAL, SICK, EXCUSE, UNPAID |
| LeaveStatus | PENDING, APPROVED, REJECTED, CANCELLED |
| ExpenseStatus | PENDING, APPROVED, REJECTED |
| NotificationType | NEWS, POLL, MESSAGE, TASK, LEAVE, EXPENSE, EVENT, SUGGESTION, CELEBRATION |
| SuggestionCategory | PROCESS, ENVIRONMENT, BENEFITS, TECHNOLOGY, OTHER |
| SuggestionStatus | PENDING, UNDER_REVIEW, APPROVED, REJECTED, IMPLEMENTED |
| EventType | MEETING, BIRTHDAY, TRAINING, HOLIDAY, OTHER |

## EK-2: ÖRNEK KOD PARÇACIKLARI

> Kod yazı tipi olarak **Consolas** önerilir.

**Kimlik Doğrulama Ara Katmanı (auth.middleware.js)**

```js
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Token bulunamadı', 401)
    }
    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, deletedAt: true },
    })
    if (!user || !user.isActive || user.deletedAt) return error(res, 'Hesap aktif değil', 401)
    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return error(res, 'Token süresi doldu', 401)
    if (err.name === 'JsonWebTokenError') return error(res, 'Geçersiz token', 401)
    return error(res, 'Kimlik doğrulama hatası', 500)
  }
}
```

**Görev Detay ve Yorum Listesi (task.controller.js — getTaskById)**

```js
const getTaskById = async (req, res) => {
  const id = parseInt(req.params.id)
  const task = await prisma.task.findFirst({ where: { id, deletedAt: null }, select: taskSelect })
  if (!task) return error(res, 'Görev bulunamadı', 404)
  if (req.user.role === 'EMPLOYEE' && task.creator.id !== req.user.id && task.assignee?.id !== req.user.id) {
    return error(res, 'Bu görevi görme yetkiniz yok', 403)
  }
  const [comments, activity] = await Promise.all([
    prisma.taskComment.findMany({
      where: { taskId: id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true, body: true, createdAt: true, updatedAt: true, user: { select: userMini } },
    }),
    prisma.activityLog.findMany({
      where: { entity: 'task', entityId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, action: true, detail: true, createdAt: true, user: { select: { id: true, firstName: true, lastName: true } } },
    }),
  ])
  return success(res, { ...task, comments, activity }, 'Görev getirildi')
}
```

**Prisma Şeması — Görev Yorumu**

```prisma
model TaskComment {
  id        Int       @id @default(autoincrement())
  taskId    Int
  userId    Int
  body      String    @db.VarChar(2000)
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([taskId, createdAt])
  @@index([userId])
  @@map("task_comments")
}
```

---

# TEZ HAZIRLAMA KONTROL LİSTESİ

- [ ] Kapaktaki ad-soyad, ay-yıl ve danışman bilgileri güncellendi
- [ ] Word'de Heading 1 / 2 / 3 stilleri başlıklara uygulandı (18 pt / 12 pt / 12 pt)
- [ ] Ana bölümler arasına **Bölüm Sonu (Sonraki Sayfa)** eklendi
- [ ] Paragraflar 0,5 cm girinti ile yazıldı
- [ ] Şekil ve tablo numaraları **Başvurular** sekmesinden eklendi
- [ ] İçindekiler, şekiller listesi, tablolar listesi güncellendi (otomatik tablo)
- [ ] Sayfa numaraları Roma rakamı → Arap rakamı dönüşümü doğru
- [ ] Giriş + Literatür + Ana Bölümler + Sonuç toplamı 30–50 sayfa aralığında
- [ ] Şekil başlıkları 10 pt ve şeklin altında ortalı
- [ ] Tablo başlıkları 10 pt ve tablonun üstünde sola dayalı
- [ ] Kaynakçada 0,5 cm asılı girinti uygulandı
- [ ] Kısaltmalar tablosunda kenarlıklar kaldırıldı
- [ ] Eklerdeki kod parçaları Consolas yazı tipinde

# Handoff: CorpConnect Dashboard

## Overview

Bu handoff, **CorpConnect** adlı kurumsal iç iletişim platformunun Ana Sayfa (Dashboard) ekranının tasarım referansını içermektedir. Dashboard; yöneticilerin günlük iş akışlarını tek bakışta görebileceği, bekleyen onayları yönetebileceği ve günün programını takip edebileceği bir ana ekrandır.

---

## About the Design Files

Bu klasördeki `Dashboard v4.html` dosyası, gerçek bir üretim uygulaması değil, **tasarım referansı olarak hazırlanmış bir HTML prototipidir.** Amacın bu HTML'i doğrudan kullanmak değil, mevcut kod tabanınızın (React, Next.js, Vue vb.) altyapısına uygun şekilde yeniden oluşturmaktır. Eğer henüz bir framework seçilmediyse, bu tür bir kurumsal uygulaması için **Next.js + TypeScript + Tailwind CSS** kombinasyonu önerilir.

---

## Fidelity

**Yüksek Fidelity (Hifi)** — Tasarım; kesin renkler, tipografi, boşluklar ve etkileşimler dahil pixel-perfect bir mockup'tır. Geliştirici bu dosyayı piksel mükemmeliyetinde uygulamalıdır.

---

## Screens / Views

### 1. Dashboard (Ana Sayfa)

**Amaç:** Yöneticiye günün özetini sunar. Bekleyen onaylar, temel metrikler, duyurular ve takvim tek ekranda yer alır.

---

### Layout

```
[NAV BAR — full width, sticky, 44px height]
─────────────────────────────────────────────────────
[PAGE — max-width: 1100px, margin: 0 auto, padding: 40px 28px]

  [GREETING — full width]
    "Günaydın, Ahmet." + tarih + özet

  [STATS STRIP — 3 column grid, full width]
    | Okunmamış Mesaj | Aktif Görev | Bekleyen Onay |

  [TWO-COLUMN GRID — 1fr + 320px fixed]
    LEFT:
      [Panel: Bekleyen Onaylar]
      [Panel: Son Duyurular]
    RIGHT:
      [Panel: Bugün (Takvim)]
```

---

## Components

### Navigation Bar

| Özellik       | Değer |
|---------------|-------|
| Height        | 44px |
| Background    | `#ffffff` |
| Border-bottom | `1px solid #e3e2de` |
| Position      | `sticky top: 0, z-index: 40` |
| Font          | Manrope, 13px |

**Logo/Brand:**
- 24×24px siyah kare (`#111110`), border-radius 4px, içinde "CC" beyaz 10px 700 weight
- Yanında "CorpConnect" 14px font-weight 600

**Nav Links:**
- Font: 13px, weight 400, color `#56554e`
- Active state: weight 500, color `#111110`, `border-bottom: 2px solid #111110`
- Hover: color `#111110`
- Links: Ana Sayfa · Haberler · Anketler · Eğitimler · Mesajlar · İzinler · Görevler · Masraflar · Takvim · Öneriler · Kutlamalar

**Sağ taraf:**
- Arama kutusu: `background #f6f5f2`, border `1px solid #e3e2de`, border-radius 5px, padding `5px 10px`
- Bildirim butonu: 30×30px, border-radius 5px, kırmızı badge (`#b91c1c`) sağ üstte
- Kullanıcı chip'i: avatar (22px daire, `#111110` bg) + isim + chevron

---

### Greeting

```
font-size: 22px
font-weight: 300
letter-spacing: -0.5px
color: #111110
margin-bottom: 36px

"Günaydın, " (light) + "Ahmet." (bold 600)

Alt satır: tarih + "·" + pending summary
font-size: 12.5px, color: #a09f99, white-space: nowrap
```

---

### Stats Strip

3 eşit sütun, `border: 1px solid #e3e2de`, `border-radius: 8px`, overflow hidden.
Her sütun arasında `border-right: 1px solid #e3e2de`.

**Her stat cell:**
- Padding: `24px 28px`
- Label: 11.5px, uppercase, letter-spacing 0.4px, color `#a09f99`
- Number: 36px, font-weight 300, letter-spacing -1.5px, color `#111110`
- Chip (badge):
  - `chip-up`: bg `#f0fdf4`, color `#15803d`
  - `chip-down`: bg `#fef2f2`, color `#b91c1c`
  - `chip-neutral`: bg `#f6f5f2`, color `#a09f99`
  - font-size: 11px, padding: `2px 7px`, border-radius: 3px

**Stats:**
1. Okunmamış Mesaj — value: 12 — chip: "108 toplam" (neutral)
2. Aktif Görev — value: 7 — chip: "↑ 3 tamamlandı" (up)
3. Bekleyen Onay — value: dynamic — chip: "Aksiyon gerekiyor" (down) veya "Tümü tamamlandı" (up)

---

### Panel (Genel)

```
background: #ffffff
border: 1px solid #e3e2de
border-radius: 8px
overflow: hidden
```

**Panel Header:**
```
padding: 15px 20px
border-bottom: 1px solid #e3e2de
display: flex, align-items: center, justify-content: space-between

title: 13px, font-weight 600
action button: 12.5px, color #1847d6, font-weight 500
```

---

### Bekleyen Onaylar (Approval Rows)

Her satır:
```
padding: 14px 20px
border-bottom: 1px solid #e3e2de
display: flex, align-items: center, gap: 14px
hover: background #fafaf8
```

**Elemanlar (soldan sağa):**
1. **Avatar** — 32px daire, bg `#f6f5f2`, border `1px solid #e3e2de`, initials 11px 600 weight `#56554e`
2. **İsim + Detay** — flex:1
   - İsim: 13px, weight 500
   - Detay: 12px, color `#a09f99`
3. **Type chip** — `white-space: nowrap`, font-size 11.5px, weight 500, padding `3px 8px`, border-radius 3px
   - İzin Talebi: bg `#fffbeb`, color `#b45309`
   - Masraf Talebi: bg `#eef2fd`, color `#1847d6`
   - Görev Onayı: bg `#f6f5f2`, color `#56554e`
4. **Butonlar:**
   - "Reddet": border `1px solid #e3e2de`, bg none, color `#56554e`, hover border darker
   - "Onayla": bg `#111110`, color white, hover `#2a2a28`
   - Padding: `5px 13px`, border-radius: 4px, font-size: 12.5px

**Boş durum:** "Bekleyen onay bulunmuyor." — centered, color `#a09f99`, padding 32px 20px

---

### Son Duyurular (Announcement Rows)

Her satır:
```
padding: 13px 20px
display: flex, gap: 12px, align-items: flex-start
border-bottom: 1px solid #e3e2de
cursor: pointer, hover: background #fafaf8
```

**Elemanlar:**
1. **Dot** — 6px daire, renk kategoriye göre, margin-top 6px
2. **Başlık** — 13px, weight 500, `text-wrap: pretty`, line-height 1.45
3. **Meta** — 11.5px, color `#a09f99` — `{Kategori} · {Yazar} · {Tarih} önce`

---

### Bugün (Schedule)

Her satır:
```
padding: 12px 18px
display: flex, align-items: center, gap: 12px
border-bottom: 1px solid #e3e2de
hover: background #fafaf8
```

**Elemanlar:**
1. **Saat** — 12px, `DM Mono` font, color `#a09f99`, width 36px
2. **Renk barı** — 2px wide, 30px tall, border-radius 1px, renk etkinlik tipine göre
   - Aktif etkinlik: opacity 1 — diğerleri: opacity 0.35
3. **Başlık + Yer** — title 13px weight 500, who 12px color `#a09f99`
4. **"Şu an" badge** (sadece aktif etkinlikte) — `white-space: nowrap`, bg `#eef2fd`, border-left `2px solid #1847d6`, color `#1847d6`, 11px 600

**Etkinlik renkleri:**
- Standup / Sprint Review: `#1847d6`
- Müşteri Demo: `#15803d`
- 1:1: `#7c3aed`
- Eğitim: `#b45309`

---

## Interactions & Behavior

- **Onayla / Reddet butonları:** Tıklandığında ilgili satır listeden kaldırılır. Bekleyen onay sayısı nav'daki badge, stats strip ve panel header'da güncellenir.
- **"Şu an" badge:** Gerçek saatle karşılaştırılarak aktif etkinliğe eklenmeli.
- **Nav linkleri:** Aktif sayfa linkinin `border-bottom: 2px solid #111110` ve `font-weight: 500`.
- **Hover states:** Tüm tablo satırlarında `background: #fafaf8`, butonlarda border/bg renk değişimi.

---

## State Management

```typescript
// Gerekli state'ler
pendingApprovals: Approval[]   // Bekleyen onay listesi — approve/reject ile güncellenir
activeNavItem: string          // Aktif nav item id'si
currentTime: Date              // "Şu an" badge için

interface Approval {
  id: number
  initialsAvatar: string       // "AK", "MD" vb.
  name: string
  type: 'İzin Talebi' | 'Masraf Talebi' | 'Görev Onayı'
  detail: string
  typeColor: string
  typeBg: string
}
```

---

## Design Tokens

```css
/* Renkler */
--bg:          #f6f5f2;   /* Sayfa arka planı */
--white:       #ffffff;
--bd:          #e3e2de;   /* Border */
--bd-strong:   #c8c7c2;   /* Hover border */

--t1:          #111110;   /* Primary text */
--t2:          #56554e;   /* Secondary text */
--t3:          #a09f99;   /* Muted text */

--blue:        #1847d6;
--blue-lt:     #eef2fd;
--green:       #15803d;
--green-lt:    #f0fdf4;
--amber:       #b45309;
--amber-lt:    #fffbeb;
--red:         #b91c1c;
--red-lt:      #fef2f2;

/* Tipografi */
font-family: 'Manrope', sans-serif;   /* Ana font */
font-family: 'DM Mono', monospace;    /* Saatler, teknik veriler */

/* Spacing */
Page padding:   40px 28px
Panel padding:  15px 20px (header), 14px 20px (row)
Gap (cols):     20px
Border-radius:  8px (panel), 5px (button/input), 4px (button), 3px (chip)
```

---

## Assets

- **Font:** Google Fonts — [Manrope](https://fonts.google.com/specimen/Manrope) (weights: 300, 400, 500, 600, 700) + [DM Mono](https://fonts.google.com/specimen/DM+Mono) (weight: 400)
- **İkonlar:** SVG path'ler HTML dosyasında inline olarak mevcuttur. [Heroicons](https://heroicons.com/) (outline) kullanılabilir.

---

## Files

| Dosya | Açıklama |
|-------|----------|
| `Dashboard v4.html` | Ana tasarım referansı — tüm bileşenler ve etkileşimler burada |

---

## Notlar

- Tasarım **1100px max-width** üzerine optimize edilmiştir. Mobil responsive tasarım bu scope'a dahil değildir.
- Bekleyen onay sayısı dinamik olduğundan backend'den çekilmeli ve realtime güncellenmesi önerilir.
- "Şu an" etkinlik vurgusu client-side saat kontrolü ile yapılabilir, backend gerektirmez.

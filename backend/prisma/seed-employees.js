const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const FIRST_NAMES = [
  'Ahmet', 'Ayşe', 'Mehmet', 'Fatma', 'Mustafa', 'Zeynep', 'Ali', 'Elif', 'Hasan', 'Merve',
  'Hüseyin', 'Selin', 'İbrahim', 'Deniz', 'Murat', 'Esra', 'Burak', 'Burcu', 'Emre', 'Pınar',
  'Onur', 'Yasemin', 'Serkan', 'Gizem', 'Volkan', 'Sevda', 'Cem', 'Damla', 'Tolga', 'Begüm',
  'Can', 'İrem', 'Bora', 'Cansu', 'Eren', 'Ece', 'Kerem', 'Buse', 'Selim', 'Melike',
  'Erhan', 'Gülşah', 'Furkan', 'Aslı', 'Berk', 'Sıla', 'Kaan', 'Tuğçe', 'Doruk', 'Nazlı',
]

const LAST_NAMES = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir',
  'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek',
  'Polat', 'Erdoğan', 'Korkmaz', 'Bulut', 'Aksoy', 'Çakır', 'Tekin', 'Bozkurt', 'Acar', 'Güler',
  'Çakmak', 'Karaca', 'Türk', 'Akın', 'Sezer', 'Şen', 'Soylu', 'Erdem', 'Toprak', 'Güneş',
  'Aktaş', 'Avcı', 'Yavuz', 'Karatay', 'Erden', 'Uzun', 'Taş', 'Akar', 'Yüksel', 'Ergin',
]

const DEPARTMENTS = [
  'Pazarlama', 'Satış', 'Bilgi Teknolojileri', 'İnsan Kaynakları', 'Finans',
  'Operasyon', 'Müşteri Hizmetleri', 'Üretim', 'Lojistik', 'Hukuk',
]

const POSITIONS = [
  'Uzman', 'Kıdemli Uzman', 'Asistan', 'Analist', 'Mühendis',
  'Sorumlu', 'Takım Lideri', 'Stajyer',
]

const pick = (arr, i) => arr[i % arr.length]

async function main() {
  console.log('50 çalışan ekleniyor...')

  const hashedPassword = await bcrypt.hash('Employee123!', 10)

  let created = 0
  let skipped = 0

  for (let i = 1; i <= 50; i++) {
    const email = `employee${i}@corpconnect.com`
    const firstName = pick(FIRST_NAMES, i - 1)
    const lastName = pick(LAST_NAMES, i - 1)
    const department = pick(DEPARTMENTS, i - 1)
    const position = pick(POSITIONS, i - 1)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      skipped++
      continue
    }

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'EMPLOYEE',
        isActive: true,
        emailVerified: true,
        profile: {
          create: { department, position },
        },
      },
    })
    created++
  }

  console.log(`Tamamlandı. Yeni eklenen: ${created}, Atlanan (zaten var): ${skipped}`)
  console.log('Şifre: Employee123! (hepsi için)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

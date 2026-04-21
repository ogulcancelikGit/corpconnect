const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

prisma.$connect()
  .then(() => console.log('Veritabanı bağlantısı başarılı'))
  .catch((err) => {
    console.error('Veritabanı bağlantı hatası:', err)
    process.exit(1)
  })

module.exports = prisma
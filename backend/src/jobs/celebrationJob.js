const cron = require('node-cron')
const prisma = require('../config/database')
const logger = require('../utils/logger')
const { notifyAll } = require('../utils/notification.util')

const isSameMonthDay = (a, b) =>
  a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const yearsBetween = (from, to) => {
  let years = to.getFullYear() - from.getFullYear()
  if (
    to.getMonth() < from.getMonth() ||
    (to.getMonth() === from.getMonth() && to.getDate() < from.getDate())
  ) {
    years -= 1
  }
  return years
}

const run = async () => {
  try {
    const today = new Date()

    const profiles = await prisma.userProfile.findMany({
      where: {
        OR: [{ birthDate: { not: null } }, { hireDate: { not: null } }],
        user: { isActive: true, deletedAt: null },
      },
      select: {
        userId: true,
        birthDate: true,
        hireDate: true,
        user: { select: { firstName: true, lastName: true } },
      },
    })

    let totalSent = 0

    for (const p of profiles) {
      const fullName = `${p.user.firstName} ${p.user.lastName}`

      if (p.birthDate && isSameMonthDay(new Date(p.birthDate), today)) {
        const sent = await notifyAll({
          title: 'Doğum Günü Kutlaması',
          body: `${fullName} bugün doğum gününü kutluyor`,
          type: 'CELEBRATION',
          link: '/celebrations',
          excludeUserId: p.userId,
        })
        totalSent += sent
      }

      if (p.hireDate && isSameMonthDay(new Date(p.hireDate), today)) {
        const years = yearsBetween(new Date(p.hireDate), today)
        if (years > 0) {
          const sent = await notifyAll({
            title: 'İş Yıldönümü',
            body: `${fullName} bugün ${years}. iş yıldönümünü kutluyor`,
            type: 'CELEBRATION',
            link: '/celebrations',
            excludeUserId: p.userId,
          })
          totalSent += sent
        }
      }
    }

    logger.info(`Kutlama job tamamlandı — ${totalSent} bildirim gönderildi`)
    return totalSent
  } catch (err) {
    logger.error('Kutlama job hatası', { err })
    return 0
  }
}

const start = () => {
  // Her gün 09:00'da
  cron.schedule('0 9 * * *', run, { timezone: 'Europe/Istanbul' })
  logger.info('Kutlama cron job başlatıldı (her gün 09:00 TR)')
}

module.exports = { start, run }

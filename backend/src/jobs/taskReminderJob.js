const cron = require('node-cron')
const prisma = require('../config/database')
const logger = require('../utils/logger')
const { notifyUsers } = require('../utils/notification.util')

// Atanmış, aktif (TODO/IN_PROGRESS) ve son tarihi bugün ya da geçmiş olan görevler için
// atanan kişiye bildirim gönderir. Her gün 09:00'da çalışır.
const run = async () => {
  try {
    const now = new Date()
    const startToday = new Date(now); startToday.setHours(0, 0, 0, 0)
    const endToday = new Date(now); endToday.setHours(23, 59, 59, 999)

    const tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        assignedTo: { not: null },
        status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
        dueDate: { not: null, lte: endToday },
        assignee: { isActive: true, deletedAt: null },
      },
      select: { id: true, title: true, dueDate: true, assignedTo: true },
    })

    let sent = 0

    for (const t of tasks) {
      const due = new Date(t.dueDate)
      const isToday = due >= startToday && due <= endToday

      const title = isToday ? 'Görev Bugün Bitiyor' : 'Geciken Görev'
      const body = isToday
        ? `"${t.title}" görevinin son günü bugün`
        : `"${t.title}" görevinin son tarihi geçti`

      const n = await notifyUsers({
        userIds: [t.assignedTo],
        title,
        body,
        type: 'TASK',
        link: `/tasks/${t.id}`,
      })
      sent += n
    }

    logger.info(`Görev hatırlatma job tamamlandı — ${tasks.length} görev, ${sent} bildirim`)
    return sent
  } catch (err) {
    logger.error('Görev hatırlatma job hatası', { err })
    return 0
  }
}

const start = () => {
  // Her gün 09:00 (TR)
  cron.schedule('0 9 * * *', run, { timezone: 'Europe/Istanbul' })
  logger.info('Görev hatırlatma cron job başlatıldı (her gün 09:00 TR)')
}

module.exports = { start, run }

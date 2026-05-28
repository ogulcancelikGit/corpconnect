const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error } = require('../utils/response.util')
const { log } = require('../utils/activityLog.util')

// POST /api/broadcast
const sendBroadcast = async (req, res) => {
  try {
    const { title, body, targetRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE'], link } = req.body

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        role: { in: targetRoles },
        id: { not: req.user.id },
      },
      select: { id: true },
    })

    if (users.length === 0) {
      return error(res, 'Hedef kullanıcı bulunamadı', 400)
    }

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title: title.trim(),
        body: body.trim(),
        type: 'SYSTEM',
        link: link || null,
      })),
    })

    log({
      userId: req.user.id,
      action: 'BROADCAST',
      detail: `"${title}" başlıklı toplu bildirim gönderildi (${users.length} kişi, hedef: ${targetRoles.join(', ')})`,
      ip: req.ip,
    })

    return success(res, { sent: users.length }, `Bildirim ${users.length} kişiye gönderildi`)
  } catch (err) {
    logger.error(err)
    return error(res, 'Bildirim gönderilemedi', 500)
  }
}

// GET /api/broadcast/history
const getBroadcastHistory = async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { action: 'BROADCAST' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    })
    return success(res, logs, 'Geçmiş getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Geçmiş getirilemedi', 500)
  }
}

module.exports = { sendBroadcast, getBroadcastHistory }

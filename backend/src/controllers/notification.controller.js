const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')

const VALID_TYPES = [
  'NEWS', 'POLL', 'MESSAGE', 'SYSTEM', 'LEAVE', 'TASK',
  'EXPENSE', 'SUGGESTION', 'CELEBRATION', 'MENTION', 'TRAINING', 'CALENDAR',
]

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = { userId: req.user.id }
    if (type && VALID_TYPES.includes(type)) {
      where.type = type
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          title: true,
          body: true,
          type: true,
          link: true,
          isRead: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
    ])

    return paginated(res, notifications, getPaginationMeta(total, page, limit), 'Bildirimler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Bildirimler getirilemedi', 500)
  }
}

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    })

    return success(res, { count }, 'Okunmamış bildirim sayısı getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Bildirim sayısı getirilemedi', 500)
  }
}

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params

    const notification = await prisma.notification.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    })

    if (!notification) {
      return error(res, 'Bildirim bulunamadı', 404)
    }

    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true, readAt: new Date() },
    })

    return success(res, null, 'Bildirim okundu olarak işaretlendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Bildirim işaretlenemedi', 500)
  }
}

// PATCH /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })

    return success(res, null, 'Tüm bildirimler okundu olarak işaretlendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Bildirimler işaretlenemedi', 500)
  }
}

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params

    const notification = await prisma.notification.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    })

    if (!notification) {
      return error(res, 'Bildirim bulunamadı', 404)
    }

    await prisma.notification.delete({
      where: { id: parseInt(id) },
    })

    return success(res, null, 'Bildirim silindi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Bildirim silinemedi', 500)
  }
}

// GET /api/notifications/preferences
const getPreferences = async (req, res) => {
  try {
    const prefs = await prisma.notificationPreference.findMany({
      where: { userId: req.user.id },
      select: { type: true, enabled: true },
    })
    const map = prefs.reduce((acc, p) => ({ ...acc, [p.type]: p.enabled }), {})
    return success(res, map, 'Tercihler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Tercihler getirilemedi', 500)
  }
}

// PUT /api/notifications/preferences  body: { MESSAGE: true, NEWS: false, ... }
const updatePreferences = async (req, res) => {
  try {
    const updates = req.body || {}
    const ops = []
    for (const [type, enabled] of Object.entries(updates)) {
      if (!VALID_TYPES.includes(type)) continue
      ops.push(
        prisma.notificationPreference.upsert({
          where: { userId_type: { userId: req.user.id, type } },
          create: { userId: req.user.id, type, enabled: !!enabled },
          update: { enabled: !!enabled },
        })
      )
    }
    await Promise.all(ops)
    return success(res, null, 'Tercihler güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Tercihler güncellenemedi', 500)
  }
}

// Yardımcı fonksiyon — diğer controller'lardan çağrılır
const createNotification = async ({ userId, title, body, type, link }) => {
  try {
    // Kullanıcı bu tipi opt-out etmişse gönderme
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId_type: { userId, type } },
      select: { enabled: true },
    })
    if (pref && !pref.enabled) return null

    const notification = await prisma.notification.create({
      data: { userId, title, body, type, link },
    })

    const { getIO } = require('../config/socket')
    try {
      const io = getIO()
      io.to(`user:${userId}`).emit('notification:new', notification)
    } catch (e) {}

    return notification
  } catch (err) {
    logger.error('Bildirim oluşturulamadı', { err })
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getPreferences,
  updatePreferences,
}
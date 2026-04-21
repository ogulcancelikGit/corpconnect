const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = { userId: req.user.id }

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
    console.error(err)
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
    console.error(err)
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
    console.error(err)
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
    console.error(err)
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
    console.error(err)
    return error(res, 'Bildirim silinemedi', 500)
  }
}

// Yardımcı fonksiyon — diğer controller'lardan çağrılır
const createNotification = async ({ userId, title, body, type, link }) => {
  try {
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
    console.error('Bildirim oluşturulamadı:', err)
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
}
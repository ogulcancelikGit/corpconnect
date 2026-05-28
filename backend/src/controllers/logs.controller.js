const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')

const ACTION_LABELS = {
  LOGIN: 'Giriş',
  LEAVE_CREATE: 'İzin Talebi',
  LEAVE_APPROVED: 'İzin Onayı',
  LEAVE_REJECTED: 'İzin Reddi',
  LEAVE_CANCELLED: 'İzin İptali',
  USER_STATUS_CHANGE: 'Kullanıcı Durumu',
  USER_ROLE_CHANGE: 'Rol Değişikliği',
  BROADCAST: 'Toplu Bildirim',
}

// GET /api/logs
const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30, action, userId } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = {
      ...(action && { action }),
      ...(userId && { userId: parseInt(userId) }),
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ])

    return paginated(res, logs, getPaginationMeta(total, page, limit), 'Loglar getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Loglar getirilemedi', 500)
  }
}

// GET /api/logs/actions
const getActionTypes = async (req, res) => {
  try {
    const actions = await prisma.activityLog.groupBy({
      by: ['action'],
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
    })
    return success(res, actions.map((a) => ({ action: a.action, label: ACTION_LABELS[a.action] || a.action, count: a._count.action })), 'Aksiyonlar getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Aksiyonlar getirilemedi', 500)
  }
}

module.exports = { getLogs, getActionTypes }

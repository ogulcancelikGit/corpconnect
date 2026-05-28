const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')

const PUBLIC_ACTIONS = [
  'NEWS_CREATE',
  'POLL_CREATE',
  'TRAINING_CREATE',
  'SUGGESTION_CREATE',
  'EVENT_CREATE',
  'BROADCAST',
]

// GET /api/activity/feed
const getPublicFeed = async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = { action: { in: PUBLIC_ACTIONS } }

    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          detail: true,
          createdAt: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ])

    return paginated(res, items, getPaginationMeta(total, page, limit), 'Akış getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Akış getirilemedi', 500)
  }
}

module.exports = { getPublicFeed }

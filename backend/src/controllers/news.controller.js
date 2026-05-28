const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')
const { notifyAll } = require('../utils/notification.util')
const { log } = require('../utils/activityLog.util')

// GET /api/news
const getNews = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
        ],
      }),
      ...(category && { category }),
    }

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take,
        skip,
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          isPinned: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          views: {
            where: { userId: req.user.id },
            select: { id: true },
            take: 1,
          },
        },
      }),
      prisma.news.count({ where }),
    ])

    const enriched = news.map(({ views, ...rest }) => ({
      ...rest,
      isViewed: views.length > 0,
    }))

    return paginated(res, enriched, getPaginationMeta(total, page, limit), 'Haberler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Haberler getirilemedi', 500)
  }
}

// GET /api/news/:id
const getNewsById = async (req, res) => {
  try {
    const { id } = req.params

    const news = await prisma.news.findFirst({
      where: { id: parseInt(id), deletedAt: null },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        isPinned: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: { avatar: true, department: true, position: true },
            },
          },
        },
        _count: { select: { views: true } },
      },
    })

    if (!news) {
      return error(res, 'Haber bulunamadı', 404)
    }

    return success(res, news, 'Haber getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Haber getirilemedi', 500)
  }
}

// POST /api/news/:id/view  — per-user idempotent view tracking
const markAsViewed = async (req, res) => {
  try {
    const newsId = parseInt(req.params.id)
    const userId = req.user.id

    const existing = await prisma.newsView.findUnique({
      where: { userId_newsId: { userId, newsId } },
      select: { id: true },
    })

    if (existing) {
      return success(res, { counted: false }, 'Daha önce görüntülendi')
    }

    await prisma.$transaction([
      prisma.newsView.create({ data: { userId, newsId } }),
      prisma.news.update({
        where: { id: newsId },
        data: { viewCount: { increment: 1 } },
      }),
    ])

    return success(res, { counted: true }, 'Görüntülenme kaydedildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Görüntülenme kaydedilemedi', 500)
  }
}

// POST /api/news
const createNews = async (req, res) => {
  try {
    const { title, content, category, isPinned } = req.body

    const news = await prisma.news.create({
      data: {
        title,
        content,
        category: category || null,
        isPinned: isPinned || false,
        authorId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        isPinned: true,
        viewCount: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    notifyAll({
      title: 'Yeni Duyuru',
      body: news.title,
      type: 'NEWS',
      link: `/news/${news.id}`,
      excludeUserId: req.user.id,
    }).catch((e) => logger.error('Haber bildirimi gönderilemedi', { e }))

    log({ userId: req.user.id, action: 'NEWS_CREATE', entity: 'News', entityId: news.id, detail: news.title, ip: req.ip })

    return success(res, news, 'Haber oluşturuldu', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Haber oluşturulamadı', 500)
  }
}

// PUT /api/news/:id
const updateNews = async (req, res) => {
  try {
    const { id } = req.params
    const { title, content, category, isPinned } = req.body

    const existing = await prisma.news.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })

    if (!existing) {
      return error(res, 'Haber bulunamadı', 404)
    }

    if (req.user.role !== 'ADMIN' && existing.authorId !== req.user.id) {
      return error(res, 'Bu haberi düzenleme yetkiniz yok', 403)
    }

    const news = await prisma.news.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category !== undefined && { category }),
        ...(isPinned !== undefined && { isPinned }),
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        isPinned: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return success(res, news, 'Haber güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Haber güncellenemedi', 500)
  }
}

// DELETE /api/news/:id
const deleteNews = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.news.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })

    if (!existing) {
      return error(res, 'Haber bulunamadı', 404)
    }

    if (req.user.role !== 'ADMIN' && existing.authorId !== req.user.id) {
      return error(res, 'Bu haberi silme yetkiniz yok', 403)
    }

    await prisma.news.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    })

    return success(res, null, 'Haber silindi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Haber silinemedi', 500)
  }
}

// PATCH /api/news/:id/pin
const togglePin = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.news.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })

    if (!existing) {
      return error(res, 'Haber bulunamadı', 404)
    }

    const news = await prisma.news.update({
      where: { id: parseInt(id) },
      data: { isPinned: !existing.isPinned },
      select: { id: true, isPinned: true },
    })

    return success(res, news, news.isPinned ? 'Haber pinlendi' : 'Haber pin kaldırıldı')
  } catch (err) {
    logger.error(err)
    return error(res, 'Pin işlemi yapılamadı', 500)
  }
}

module.exports = { getNews, getNewsById, createNews, updateNews, deleteNews, togglePin, markAsViewed }

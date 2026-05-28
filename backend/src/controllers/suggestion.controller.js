const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')
const { log } = require('../utils/activityLog.util')

const categoryLabels = {
  PROCESS: 'Süreç İyileştirme',
  TECHNOLOGY: 'Teknoloji',
  CULTURE: 'Şirket Kültürü',
  SAFETY: 'İş Güvenliği',
  OTHER: 'Diğer',
}

const statusLabels = {
  PENDING: 'Beklemede',
  UNDER_REVIEW: 'İnceleniyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
}

// GET /api/suggestions/my
const getMySuggestions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = {
      userId: req.user.id,
      deletedAt: null,
      ...(status && { status }),
    }

    const [suggestions, total] = await Promise.all([
      prisma.suggestion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.suggestion.count({ where }),
    ])

    return paginated(res, suggestions, getPaginationMeta(total, page, limit), 'Öneriler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Öneriler getirilemedi', 500)
  }
}

// GET /api/suggestions - Tüm öneriler (ADMIN/MANAGER)
const getAllSuggestions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = {
      deletedAt: null,
      ...(status && { status }),
      ...(category && { category }),
    }

    const [suggestions, total] = await Promise.all([
      prisma.suggestion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
            include: { profile: { select: { department: true, position: true } } },
          },
        },
      }),
      prisma.suggestion.count({ where }),
    ])

    const result = suggestions.map((s) => ({
      ...s,
      user: s.isAnonymous ? null : s.user,
      isAnonymous: s.isAnonymous,
    }))

    return paginated(res, result, getPaginationMeta(total, page, limit), 'Öneriler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Öneriler getirilemedi', 500)
  }
}

// POST /api/suggestions
const createSuggestion = async (req, res) => {
  try {
    const { title, content, category = 'OTHER', isAnonymous = false } = req.body

    const suggestion = await prisma.suggestion.create({
      data: {
        userId: req.user.id,
        title,
        content,
        category,
        isAnonymous,
      },
    })

    await prisma.notification.createMany({
      data: await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true, deletedAt: null },
        select: { id: true },
      }).then((managers) =>
        managers.map((m) => ({
          userId: m.id,
          title: 'Yeni Öneri',
          body: isAnonymous
            ? `Anonim öneri: ${title}`
            : `${req.user.firstName} ${req.user.lastName}: ${title}`,
          type: 'SUGGESTION',
          link: '/superadmin/suggestions',
        }))
      ),
    })

    log({ userId: req.user.id, action: 'SUGGESTION_CREATE', entity: 'Suggestion', entityId: suggestion.id, detail: title, ip: req.ip })

    return success(res, suggestion, 'Öneri oluşturuldu', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Öneri oluşturulamadı', 500)
  }
}

// PUT /api/suggestions/:id/review
const reviewSuggestion = async (req, res) => {
  try {
    const { id } = req.params
    const { status, adminNote } = req.body

    const existing = await prisma.suggestion.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })

    if (!existing) return error(res, 'Öneri bulunamadı', 404)

    const suggestion = await prisma.suggestion.update({
      where: { id: parseInt(id) },
      data: {
        status,
        adminNote,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
    })

    if (!existing.isAnonymous) {
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          title: status === 'APPROVED' ? 'Öneriniz Onaylandı 🎉' : status === 'REJECTED' ? 'Öneriniz Değerlendirildi' : 'Öneriniz İnceleniyor',
          body: adminNote
            ? `"${existing.title}" öneriniz: ${adminNote}`
            : `"${existing.title}" öneriniz ${statusLabels[status].toLowerCase()} olarak güncellendi`,
          type: 'SUGGESTION',
          link: '/suggestions',
        },
      })
    }

    log({ userId: req.user.id, action: `SUGGESTION_${status}`, entity: 'Suggestion', entityId: parseInt(id), detail: existing.title, ip: req.ip })

    return success(res, suggestion, 'Öneri güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Öneri güncellenemedi', 500)
  }
}

// DELETE /api/suggestions/:id
const deleteSuggestion = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.suggestion.findFirst({
      where: { id: parseInt(id), userId: req.user.id, deletedAt: null },
    })

    if (!existing) return error(res, 'Öneri bulunamadı', 404)
    if (existing.status !== 'PENDING') return error(res, 'Sadece beklemedeki öneriler silinebilir', 400)

    await prisma.suggestion.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    })

    return success(res, null, 'Öneri silindi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Öneri silinemedi', 500)
  }
}

// GET /api/suggestions/stats
const getSuggestionStats = async (req, res) => {
  try {
    const [pending, underReview, approved, rejected, total] = await Promise.all([
      prisma.suggestion.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.suggestion.count({ where: { status: 'UNDER_REVIEW', deletedAt: null } }),
      prisma.suggestion.count({ where: { status: 'APPROVED', deletedAt: null } }),
      prisma.suggestion.count({ where: { status: 'REJECTED', deletedAt: null } }),
      prisma.suggestion.count({ where: { deletedAt: null } }),
    ])

    return success(res, { pending, underReview, approved, rejected, total }, 'İstatistikler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'İstatistikler getirilemedi', 500)
  }
}

module.exports = { getMySuggestions, getAllSuggestions, createSuggestion, reviewSuggestion, deleteSuggestion, getSuggestionStats }

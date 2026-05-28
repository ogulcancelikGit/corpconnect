const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')
const { log } = require('../utils/activityLog.util')

const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
}

const leaveTypeLabels = {
  ANNUAL: 'Yıllık İzin',
  SICK: 'Hastalık İzni',
  EXCUSE: 'Mazeret İzni',
  UNPAID: 'Ücretsiz İzin',
}

// GET /api/leaves/my - Kendi izin talepleri
const getMyLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = {
      userId: req.user.id,
      deletedAt: null,
      ...(status && { status }),
    }

    const [leaves, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          reviewer: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.leaveRequest.count({ where }),
    ])

    return paginated(res, leaves, getPaginationMeta(total, page, limit), 'İzin talepleri getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'İzin talepleri getirilemedi', 500)
  }
}

// GET /api/leaves - Tüm izin talepleri (ADMIN/MANAGER)
const getAllLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = {
      deletedAt: null,
      ...(status && { status }),
      ...(userId && { userId: parseInt(userId) }),
    }

    const [leaves, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profile: { select: { department: true, position: true } },
            },
          },
          reviewer: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.leaveRequest.count({ where }),
    ])

    return paginated(res, leaves, getPaginationMeta(total, page, limit), 'İzin talepleri getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'İzin talepleri getirilemedi', 500)
  }
}

// POST /api/leaves - Yeni izin talebi
const createLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body
    const days = calculateDays(startDate, endDate)

    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        userId: req.user.id,
        deletedAt: null,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { startDate: { lte: new Date(endDate) }, endDate: { gte: new Date(startDate) } },
        ],
      },
    })

    if (overlap) {
      return error(res, 'Bu tarih aralığında zaten bir izin talebiniz var', 400)
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        userId: req.user.id,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days,
        reason,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    await prisma.notification.createMany({
      data: await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true, deletedAt: null },
        select: { id: true, role: true },
      }).then((managers) =>
        managers.map((m) => ({
          userId: m.id,
          title: 'Yeni İzin Talebi',
          body: `${leave.user.firstName} ${leave.user.lastName} - ${leaveTypeLabels[type]} (${days} gün)`,
          type: 'LEAVE',
          link: m.role === 'ADMIN' ? '/superadmin/leaves' : '/leaves',
        }))
      ),
    })

    log({ userId: req.user.id, action: 'LEAVE_CREATE', entity: 'LeaveRequest', entityId: leave.id, detail: `${leaveTypeLabels[type]} talebi oluşturuldu (${days} gün)`, ip: req.ip })

    return success(res, leave, 'İzin talebi oluşturuldu', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'İzin talebi oluşturulamadı', 500)
  }
}

// PUT /api/leaves/:id/review - Onayla/Reddet (ADMIN/MANAGER)
const reviewLeave = async (req, res) => {
  try {
    const { id } = req.params
    const { status, reviewNote } = req.body

    const existing = await prisma.leaveRequest.findFirst({
      where: { id: parseInt(id), deletedAt: null },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    })

    if (!existing) return error(res, 'İzin talebi bulunamadı', 404)
    if (existing.status !== 'PENDING') return error(res, 'Bu talep zaten işleme alınmış', 400)

    const leave = await prisma.leaveRequest.update({
      where: { id: parseInt(id) },
      data: {
        status,
        reviewedBy: req.user.id,
        reviewNote,
        reviewedAt: new Date(),
      },
    })

    await prisma.notification.create({
      data: {
        userId: existing.userId,
        title: status === 'APPROVED' ? 'İzin Talebiniz Onaylandı' : 'İzin Talebiniz Reddedildi',
        body: `${leaveTypeLabels[existing.type]} talebiniz ${status === 'APPROVED' ? 'onaylandı' : 'reddedildi'}${reviewNote ? `: ${reviewNote}` : ''}`,
        type: 'LEAVE',
        link: '/leaves',
      },
    })

    log({ userId: req.user.id, action: `LEAVE_${status}`, entity: 'LeaveRequest', entityId: parseInt(id), detail: `${existing.user.firstName} ${existing.user.lastName} izni ${status === 'APPROVED' ? 'onaylandı' : 'reddedildi'}${reviewNote ? ': ' + reviewNote : ''}`, ip: req.ip })

    return success(res, leave, `İzin talebi ${status === 'APPROVED' ? 'onaylandı' : 'reddedildi'}`)
  } catch (err) {
    logger.error(err)
    return error(res, 'İşlem gerçekleştirilemedi', 500)
  }
}

// DELETE /api/leaves/:id - İptal et (sadece kendi PENDING talebi)
const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.leaveRequest.findFirst({
      where: { id: parseInt(id), userId: req.user.id, deletedAt: null },
    })

    if (!existing) return error(res, 'İzin talebi bulunamadı', 404)
    if (existing.status !== 'PENDING') return error(res, 'Sadece bekleyen talepler iptal edilebilir', 400)

    await prisma.leaveRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'CANCELLED', deletedAt: new Date() },
    })

    return success(res, null, 'İzin talebi iptal edildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'İptal işlemi gerçekleştirilemedi', 500)
  }
}

// GET /api/leaves/stats - İstatistikler (ADMIN/MANAGER)
const getLeaveStats = async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      prisma.leaveRequest.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.leaveRequest.count({ where: { status: 'APPROVED', deletedAt: null } }),
      prisma.leaveRequest.count({ where: { status: 'REJECTED', deletedAt: null } }),
      prisma.leaveRequest.count({ where: { deletedAt: null } }),
    ])

    return success(res, { pending, approved, rejected, total }, 'İstatistikler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'İstatistikler getirilemedi', 500)
  }
}

module.exports = { getMyLeaves, getAllLeaves, createLeave, reviewLeave, cancelLeave, getLeaveStats }

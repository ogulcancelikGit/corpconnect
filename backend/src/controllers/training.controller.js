const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')
const { notifyAll } = require('../utils/notification.util')
const { log } = require('../utils/activityLog.util')

// GET /api/training
const getTrainings = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(category && { category }),
    }

    const [trainings, total] = await Promise.all([
      prisma.training.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          title: true,
          description: true,
          videoUrl: true,
          fileUrl: true,
          category: true,
          duration: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: { id: true, firstName: true, lastName: true },
          },
          files: {
            select: {
              file: {
                select: {
                  id: true,
                  originalName: true,
                  mimeType: true,
                  fileSize: true,
                  filePath: true,
                },
              },
            },
          },
          views: {
            where: { userId: req.user.id },
            select: { id: true },
            take: 1,
          },
        },
      }),
      prisma.training.count({ where }),
    ])

    const enriched = trainings.map(({ views, ...rest }) => ({
      ...rest,
      isViewed: views.length > 0,
    }))

    return paginated(res, enriched, getPaginationMeta(total, page, limit), 'Eğitimler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Eğitimler getirilemedi', 500)
  }
}

// GET /api/training/:id
const getTrainingById = async (req, res) => {
  try {
    const { id } = req.params

    const training = await prisma.training.findFirst({
      where: { id: parseInt(id), deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        fileUrl: true,
        category: true,
        duration: true,
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
        files: {
          select: {
            file: {
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                fileSize: true,
                filePath: true,
              },
            },
          },
        },
        _count: { select: { views: true } },
      },
    })

    if (!training) {
      return error(res, 'Eğitim bulunamadı', 404)
    }

    return success(res, training, 'Eğitim getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Eğitim getirilemedi', 500)
  }
}

// POST /api/training/:id/view  — per-user idempotent view tracking
const markAsViewed = async (req, res) => {
  try {
    const trainingId = parseInt(req.params.id)
    const userId = req.user.id

    const existing = await prisma.trainingView.findUnique({
      where: { userId_trainingId: { userId, trainingId } },
      select: { id: true },
    })

    if (existing) {
      return success(res, { counted: false }, 'Daha önce görüntülendi')
    }

    await prisma.$transaction([
      prisma.trainingView.create({ data: { userId, trainingId } }),
      prisma.training.update({
        where: { id: trainingId },
        data: { viewCount: { increment: 1 } },
      }),
    ])

    return success(res, { counted: true }, 'Görüntülenme kaydedildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Görüntülenme kaydedilemedi', 500)
  }
}

// POST /api/training
const createTraining = async (req, res) => {
  try {
    const { title, description, videoUrl, fileUrl, category, duration } = req.body

    const training = await prisma.training.create({
      data: {
        title,
        description: description || null,
        videoUrl: videoUrl || null,
        fileUrl: fileUrl || null,
        category: category || null,
        duration: duration ? parseInt(duration) : null,
        authorId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        fileUrl: true,
        category: true,
        duration: true,
        viewCount: true,
        createdAt: true,
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    notifyAll({
      title: 'Yeni Eğitim',
      body: training.title,
      type: 'TRAINING',
      link: `/training/${training.id}`,
      excludeUserId: req.user.id,
    }).catch((e) => logger.error('Eğitim bildirimi gönderilemedi', { e }))

    log({ userId: req.user.id, action: 'TRAINING_CREATE', entity: 'Training', entityId: training.id, detail: training.title, ip: req.ip })

    return success(res, training, 'Eğitim oluşturuldu', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Eğitim oluşturulamadı', 500)
  }
}

// PUT /api/training/:id
const updateTraining = async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, videoUrl, fileUrl, category, duration } = req.body

    const existing = await prisma.training.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })

    if (!existing) {
      return error(res, 'Eğitim bulunamadı', 404)
    }

    if (req.user.role !== 'ADMIN' && existing.authorId !== req.user.id) {
      return error(res, 'Bu eğitimi düzenleme yetkiniz yok', 403)
    }

    const training = await prisma.training.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(category !== undefined && { category }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        fileUrl: true,
        category: true,
        duration: true,
        viewCount: true,
        updatedAt: true,
      },
    })

    return success(res, training, 'Eğitim güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Eğitim güncellenemedi', 500)
  }
}

// DELETE /api/training/:id
const deleteTraining = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.training.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })

    if (!existing) {
      return error(res, 'Eğitim bulunamadı', 404)
    }

    if (req.user.role !== 'ADMIN' && existing.authorId !== req.user.id) {
      return error(res, 'Bu eğitimi silme yetkiniz yok', 403)
    }

    await prisma.training.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    })

    return success(res, null, 'Eğitim silindi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Eğitim silinemedi', 500)
  }
}

// GET /api/training/categories
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.training.findMany({
      where: { deletedAt: null, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })

    return success(res, categories.map((c) => c.category), 'Kategoriler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Kategoriler getirilemedi', 500)
  }
}

module.exports = {
  getTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
  getCategories,
  markAsViewed,
}
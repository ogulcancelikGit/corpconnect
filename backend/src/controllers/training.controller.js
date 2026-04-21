const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')

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
        },
      }),
      prisma.training.count({ where }),
    ])

    return paginated(res, trainings, getPaginationMeta(total, page, limit), 'Eğitimler getirildi')
  } catch (err) {
    console.error(err)
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
      },
    })

    if (!training) {
      return error(res, 'Eğitim bulunamadı', 404)
    }

    await prisma.training.update({
      where: { id: parseInt(id) },
      data: { viewCount: { increment: 1 } },
    })

    return success(res, { ...training, viewCount: training.viewCount + 1 }, 'Eğitim getirildi')
  } catch (err) {
    console.error(err)
    return error(res, 'Eğitim getirilemedi', 500)
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

    return success(res, training, 'Eğitim oluşturuldu', 201)
  } catch (err) {
    console.error(err)
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
    console.error(err)
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
    console.error(err)
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
    console.error(err)
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
}
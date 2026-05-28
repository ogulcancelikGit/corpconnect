const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')
const path = require('path')
const fs = require('fs')

// POST /api/files/upload
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, 'Dosya bulunamadı', 400)
    }

    const file = await prisma.file.create({
      data: {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: req.file.path.replace(/\\/g, '/'),
        uploadedBy: req.user.id,
      },
    })

    return success(res, file, 'Dosya yüklendi', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Dosya yüklenemedi', 500)
  }
}

// GET /api/files
const getFiles = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = {
      deletedAt: null,
      uploadedBy: req.user.id,
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          fileSize: true,
          filePath: true,
          createdAt: true,
        },
      }),
      prisma.file.count({ where }),
    ])

    return paginated(res, files, getPaginationMeta(total, page, limit), 'Dosyalar getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Dosyalar getirilemedi', 500)
  }
}

// GET /api/files/:id
const getFileById = async (req, res) => {
  try {
    const { id } = req.params

    const file = await prisma.file.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })

    if (!file) {
      return error(res, 'Dosya bulunamadı', 404)
    }

    return success(res, file, 'Dosya getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Dosya getirilemedi', 500)
  }
}

// GET /api/files/:id/download
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params

    const file = await prisma.file.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })

    if (!file) {
      return error(res, 'Dosya bulunamadı', 404)
    }

    const filePath = path.resolve(file.filePath)

    if (!fs.existsSync(filePath)) {
      return error(res, 'Dosya sistemde bulunamadı', 404)
    }

    res.download(filePath, file.originalName)
  } catch (err) {
    logger.error(err)
    return error(res, 'Dosya indirilemedi', 500)
  }
}

// DELETE /api/files/:id
const deleteFile = async (req, res) => {
  try {
    const { id } = req.params

    const file = await prisma.file.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })

    if (!file) {
      return error(res, 'Dosya bulunamadı', 404)
    }

    if (req.user.role !== 'ADMIN' && file.uploadedBy !== req.user.id) {
      return error(res, 'Bu dosyayı silme yetkiniz yok', 403)
    }

    await prisma.file.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    })

    return success(res, null, 'Dosya silindi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Dosya silinemedi', 500)
  }
}

module.exports = { uploadFile, getFiles, getFileById, downloadFile, deleteFile }
const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error } = require('../utils/response.util')

const labelSelect = { id: true, name: true, color: true }

// GET /api/labels - Tüm etiketler (görev sayısıyla)
const getLabels = async (req, res) => {
  try {
    const labels = await prisma.label.findMany({
      orderBy: { name: 'asc' },
      select: { ...labelSelect, _count: { select: { tasks: true } } },
    })
    const shaped = labels.map((l) => ({ id: l.id, name: l.name, color: l.color, taskCount: l._count.tasks }))
    return success(res, shaped, 'Etiketler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Etiketler getirilemedi', 500)
  }
}

// POST /api/labels - Yeni etiket (ADMIN/MANAGER)
const createLabel = async (req, res) => {
  try {
    const { name, color } = req.body

    const existing = await prisma.label.findUnique({ where: { name: name.trim() } })
    if (existing) return error(res, 'Bu isimde bir etiket zaten var', 409)

    const label = await prisma.label.create({
      data: { name: name.trim(), color: color || '#6b7280' },
      select: labelSelect,
    })
    return success(res, label, 'Etiket oluşturuldu', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Etiket oluşturulamadı', 500)
  }
}

// DELETE /api/labels/:id - Etiket sil (ADMIN/MANAGER) — ilişkili task_labels cascade ile silinir
const deleteLabel = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (Number.isNaN(id)) return error(res, 'Geçersiz etiket', 400)

    const existing = await prisma.label.findUnique({ where: { id } })
    if (!existing) return error(res, 'Etiket bulunamadı', 404)

    await prisma.label.delete({ where: { id } })
    return success(res, null, 'Etiket silindi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Etiket silinemedi', 500)
  }
}

module.exports = { getLabels, createLabel, deleteLabel }

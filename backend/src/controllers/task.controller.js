const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')
const { createNotification } = require('./notification.controller')

const STATUS_LABELS = {
  TODO: 'Yapılacak',
  IN_PROGRESS: 'Devam ediyor',
  DONE: 'Tamamlandı',
  CANCELLED: 'İptal edildi',
}

const taskSelect = {
  id: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  creator: { select: { id: true, firstName: true, lastName: true } },
  assignee: { select: { id: true, firstName: true, lastName: true, profile: { select: { avatar: true } } } },
}

// GET /api/tasks - Görevleri listele
const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, priority, mine } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = {
      deletedAt: null,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(mine === 'true' && {
        OR: [{ assignedTo: req.user.id }, { createdBy: req.user.id }],
      }),
    }

    // Normal çalışan sadece kendi görevlerini görebilir
    if (req.user.role === 'EMPLOYEE') {
      where.OR = [{ assignedTo: req.user.id }, { createdBy: req.user.id }]
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({ where, orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }], take, skip, select: taskSelect }),
      prisma.task.count({ where }),
    ])

    return paginated(res, tasks, getPaginationMeta(total, page, limit), 'Görevler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Görevler getirilemedi', 500)
  }
}

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo } = req.body

    if (assignedTo) {
      const user = await prisma.user.findFirst({ where: { id: parseInt(assignedTo), isActive: true, deletedAt: null } })
      if (!user) return error(res, 'Atanacak kullanıcı bulunamadı', 404)
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'NORMAL',
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: req.user.id,
        assignedTo: assignedTo ? parseInt(assignedTo) : null,
      },
      select: taskSelect,
    })

    if (assignedTo && parseInt(assignedTo) !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: parseInt(assignedTo),
          title: 'Yeni Görev Atandı',
          body: `"${title}" görevi size atandı`,
          type: 'TASK',
          link: '/tasks',
        },
      })
    }

    return success(res, task, 'Görev oluşturuldu', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Görev oluşturulamadı', 500)
  }
}

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, priority, status, dueDate, assignedTo } = req.body

    const existing = await prisma.task.findFirst({ where: { id: parseInt(id), deletedAt: null } })
    if (!existing) return error(res, 'Görev bulunamadı', 404)

    // Çalışan sadece kendi görevinin statusunu güncelleyebilir
    if (req.user.role === 'EMPLOYEE') {
      if (existing.assignedTo !== req.user.id && existing.createdBy !== req.user.id) {
        return error(res, 'Bu görevi düzenleme yetkiniz yok', 403)
      }
    }

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assignedTo !== undefined && { assignedTo: assignedTo ? parseInt(assignedTo) : null }),
      },
      select: taskSelect,
    })

    const statusChanged = status && status !== existing.status
    const assigneeChanged = assignedTo !== undefined &&
      (assignedTo ? parseInt(assignedTo) : null) !== existing.assignedTo
    const recipient = existing.assignedTo

    if (statusChanged && !assigneeChanged && recipient && recipient !== req.user.id) {
      await createNotification({
        userId: recipient,
        title: 'Görev Durumu Güncellendi',
        body: `"${existing.title}" görevinin durumu "${STATUS_LABELS[status] || status}" olarak değişti`,
        type: 'TASK',
        link: '/tasks',
      })
    }

    return success(res, task, 'Görev güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Görev güncellenemedi', 500)
  }
}

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.task.findFirst({ where: { id: parseInt(id), deletedAt: null } })
    if (!existing) return error(res, 'Görev bulunamadı', 404)

    if (req.user.role === 'EMPLOYEE' && existing.createdBy !== req.user.id) {
      return error(res, 'Bu görevi silme yetkiniz yok', 403)
    }

    await prisma.task.update({ where: { id: parseInt(id) }, data: { deletedAt: new Date() } })

    return success(res, null, 'Görev silindi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Görev silinemedi', 500)
  }
}

// GET /api/tasks/users - Görev atamak için kullanıcı listesi
const getAssignableUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, profile: { select: { department: true, position: true } } },
      orderBy: { firstName: 'asc' },
    })
    return success(res, users, 'Kullanıcılar getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Kullanıcılar getirilemedi', 500)
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask, getAssignableUsers }

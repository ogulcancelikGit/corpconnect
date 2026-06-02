const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')
const { createNotification } = require('./notification.controller')
const activityLog = require('../utils/activityLog.util')

const STATUS_LABELS = {
  TODO: 'Yapılacak',
  IN_PROGRESS: 'Devam ediyor',
  REVIEW: 'İncelemede',
  DONE: 'Tamamlandı',
  CANCELLED: 'İptal edildi',
}

const PRIORITY_LABELS = {
  LOW: 'Düşük',
  NORMAL: 'Normal',
  HIGH: 'Yüksek',
  URGENT: 'Acil',
}

const userMini = { id: true, firstName: true, lastName: true, profile: { select: { avatar: true } } }

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
  labels: { select: { label: { select: { id: true, name: true, color: true } } } },
}

const fullName = (u) => (u ? `${u.firstName} ${u.lastName}`.trim() : 'Bilinmeyen')

// Prisma'nın iç içe label yapısını ({ label: {...} }) düz diziye çevirir
const shapeTask = (task) =>
  task ? { ...task, labels: Array.isArray(task.labels) ? task.labels.map((tl) => tl.label) : [] } : task

// labelIds dizisini temizler: pozitif tam sayılar, tekilleştirilmiş
const normalizeLabelIds = (labelIds) =>
  Array.isArray(labelIds)
    ? [...new Set(labelIds.map((v) => parseInt(v)).filter((n) => Number.isInteger(n) && n > 0))]
    : null

// GET /api/tasks - Görevleri listele
const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, priority, mine, search, labelId } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = {
      deletedAt: null,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(labelId && { labels: { some: { labelId: parseInt(labelId) } } }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    }

    // EMPLOYEE sadece kendi görevlerini görür; MANAGER/ADMIN hepsini, ama "mine" filtresi varsa kendi görevlerine sıkıştır
    const restrictToOwn = req.user.role === 'EMPLOYEE' || mine === 'true'
    if (restrictToOwn) {
      const ownClause = { OR: [{ assignedTo: req.user.id }, { createdBy: req.user.id }] }
      where.AND = where.AND ? [...where.AND, ownClause] : [ownClause]
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({ where, orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }], take, skip, select: taskSelect }),
      prisma.task.count({ where }),
    ])

    return paginated(res, tasks.map(shapeTask), getPaginationMeta(total, page, limit), 'Görevler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Görevler getirilemedi', 500)
  }
}

// GET /api/tasks/:id - Tek görev detay (yorumlar + aktivite)
const getTaskById = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (Number.isNaN(id)) return error(res, 'Geçersiz görev', 400)

    const task = await prisma.task.findFirst({ where: { id, deletedAt: null }, select: taskSelect })
    if (!task) return error(res, 'Görev bulunamadı', 404)

    // EMPLOYEE sadece atanan/oluşturan olarak yer aldığı görevleri görebilir
    if (req.user.role === 'EMPLOYEE' && task.creator.id !== req.user.id && task.assignee?.id !== req.user.id) {
      return error(res, 'Bu görevi görme yetkiniz yok', 403)
    }

    const [comments, activity, checklist] = await Promise.all([
      prisma.taskComment.findMany({
        where: { taskId: id, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { id: true, body: true, createdAt: true, updatedAt: true, user: { select: userMini } },
      }),
      prisma.activityLog.findMany({
        where: { entity: 'task', entityId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, action: true, detail: true, createdAt: true, user: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.taskChecklistItem.findMany({
        where: { taskId: id },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, text: true, isDone: true, position: true },
      }),
    ])

    return success(res, { ...shapeTask(task), comments, activity, checklist }, 'Görev getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Görev getirilemedi', 500)
  }
}

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo, labelIds } = req.body

    if (assignedTo) {
      const user = await prisma.user.findFirst({ where: { id: parseInt(assignedTo), isActive: true, deletedAt: null } })
      if (!user) return error(res, 'Atanacak kullanıcı bulunamadı', 404)
    }

    const cleanLabelIds = normalizeLabelIds(labelIds)

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'NORMAL',
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: req.user.id,
        assignedTo: assignedTo ? parseInt(assignedTo) : null,
        ...(cleanLabelIds && cleanLabelIds.length
          ? { labels: { create: cleanLabelIds.map((labelId) => ({ labelId })) } }
          : {}),
      },
      select: taskSelect,
    })

    if (assignedTo && parseInt(assignedTo) !== req.user.id) {
      await createNotification({
        userId: parseInt(assignedTo),
        title: 'Yeni Görev Atandı',
        body: `"${title}" görevi size atandı`,
        type: 'TASK',
        link: `/tasks/${task.id}`,
      })
    }

    await activityLog.log({
      userId: req.user.id,
      action: 'task.create',
      entity: 'task',
      entityId: task.id,
      detail: `"${task.title}" görevi oluşturuldu`,
      ip: req.ip,
    })

    return success(res, shapeTask(task), 'Görev oluşturuldu', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Görev oluşturulamadı', 500)
  }
}

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { title, description, priority, status, dueDate, assignedTo, labelIds } = req.body

    const existing = await prisma.task.findFirst({ where: { id, deletedAt: null } })
    if (!existing) return error(res, 'Görev bulunamadı', 404)

    if (req.user.role === 'EMPLOYEE') {
      if (existing.assignedTo !== req.user.id && existing.createdBy !== req.user.id) {
        return error(res, 'Bu görevi düzenleme yetkiniz yok', 403)
      }
    }

    await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assignedTo !== undefined && { assignedTo: assignedTo ? parseInt(assignedTo) : null }),
      },
    })

    // Etiketleri yeniden eşitle (gönderildiyse): mevcutları sil, yenilerini ekle
    const cleanLabelIds = normalizeLabelIds(labelIds)
    if (cleanLabelIds !== null) {
      await prisma.taskLabel.deleteMany({ where: { taskId: id } })
      if (cleanLabelIds.length) {
        await prisma.taskLabel.createMany({ data: cleanLabelIds.map((labelId) => ({ taskId: id, labelId })) })
      }
    }

    const task = await prisma.task.findUnique({ where: { id }, select: taskSelect })

    const newAssignee = assignedTo !== undefined ? (assignedTo ? parseInt(assignedTo) : null) : existing.assignedTo
    const statusChanged = status && status !== existing.status
    const assigneeChanged = assignedTo !== undefined && newAssignee !== existing.assignedTo
    const priorityChanged = priority && priority !== existing.priority

    const actorName = fullName(req.user)
    const changes = []
    if (statusChanged) changes.push(`durum ${STATUS_LABELS[existing.status] || existing.status} → ${STATUS_LABELS[status] || status}`)
    if (priorityChanged) changes.push(`öncelik ${PRIORITY_LABELS[existing.priority] || existing.priority} → ${PRIORITY_LABELS[priority] || priority}`)
    if (assigneeChanged) {
      if (newAssignee === null) changes.push('atama kaldırıldı')
      else if (existing.assignedTo === null) changes.push('kullanıcıya atandı')
      else changes.push('atanan kişi değiştirildi')
    }
    if (title && title !== existing.title) changes.push('başlık güncellendi')

    if (changes.length > 0) {
      await activityLog.log({
        userId: req.user.id,
        action: 'task.update',
        entity: 'task',
        entityId: task.id,
        detail: `${actorName}: ${changes.join(', ')}`,
        ip: req.ip,
      })
    }

    // Bildirimler — atama değiştiyse yeni atanana, statü değiştiyse mevcut atanana
    if (assigneeChanged) {
      if (newAssignee && newAssignee !== req.user.id) {
        await createNotification({
          userId: newAssignee,
          title: 'Yeni Görev Atandı',
          body: `"${existing.title}" görevi size atandı`,
          type: 'TASK',
          link: `/tasks/${task.id}`,
        })
      }
      if (existing.assignedTo && existing.assignedTo !== req.user.id && existing.assignedTo !== newAssignee) {
        await createNotification({
          userId: existing.assignedTo,
          title: 'Görev Sizden Alındı',
          body: `"${existing.title}" görevinin ataması değişti`,
          type: 'TASK',
          link: `/tasks/${task.id}`,
        })
      }
    } else if (statusChanged && existing.assignedTo && existing.assignedTo !== req.user.id) {
      await createNotification({
        userId: existing.assignedTo,
        title: 'Görev Durumu Güncellendi',
        body: `"${existing.title}" görevinin durumu "${STATUS_LABELS[status] || status}" olarak değişti`,
        type: 'TASK',
        link: `/tasks/${task.id}`,
      })
    }

    return success(res, shapeTask(task), 'Görev güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Görev güncellenemedi', 500)
  }
}

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const id = parseInt(req.params.id)

    const existing = await prisma.task.findFirst({ where: { id, deletedAt: null } })
    if (!existing) return error(res, 'Görev bulunamadı', 404)

    if (req.user.role === 'EMPLOYEE' && existing.createdBy !== req.user.id) {
      return error(res, 'Bu görevi silme yetkiniz yok', 403)
    }

    await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } })

    await activityLog.log({
      userId: req.user.id,
      action: 'task.delete',
      entity: 'task',
      entityId: id,
      detail: `"${existing.title}" görevi silindi`,
      ip: req.ip,
    })

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
      where: { isActive: true, deletedAt: null, role: { not: 'ADMIN' } },
      select: { id: true, firstName: true, lastName: true, profile: { select: { department: true, position: true } } },
      orderBy: { firstName: 'asc' },
    })
    return success(res, users, 'Kullanıcılar getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Kullanıcılar getirilemedi', 500)
  }
}

// ============================================================
// YORUMLAR
// ============================================================

const ensureTaskAccess = async (taskId, user) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    select: { id: true, title: true, createdBy: true, assignedTo: true },
  })
  if (!task) return { error: 'Görev bulunamadı', code: 404 }
  if (user.role === 'EMPLOYEE' && task.createdBy !== user.id && task.assignedTo !== user.id) {
    return { error: 'Bu görevi görme yetkiniz yok', code: 403 }
  }
  return { task }
}

// POST /api/tasks/:id/comments
const addComment = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)
    const { body } = req.body
    if (Number.isNaN(taskId)) return error(res, 'Geçersiz görev', 400)

    const access = await ensureTaskAccess(taskId, req.user)
    if (access.error) return error(res, access.error, access.code)

    const comment = await prisma.taskComment.create({
      data: { taskId, userId: req.user.id, body: body.trim() },
      select: { id: true, body: true, createdAt: true, updatedAt: true, user: { select: userMini } },
    })

    await activityLog.log({
      userId: req.user.id,
      action: 'task.comment',
      entity: 'task',
      entityId: taskId,
      detail: `${fullName(req.user)} yorum ekledi`,
      ip: req.ip,
    })

    // İlgili kişilere (atayan + atanan, kendisi hariç) bildirim
    const recipients = new Set()
    if (access.task.createdBy && access.task.createdBy !== req.user.id) recipients.add(access.task.createdBy)
    if (access.task.assignedTo && access.task.assignedTo !== req.user.id) recipients.add(access.task.assignedTo)

    await Promise.all(
      [...recipients].map((userId) =>
        createNotification({
          userId,
          title: 'Göreve Yeni Yorum',
          body: `"${access.task.title}" görevine ${fullName(req.user)} yorum yaptı`,
          type: 'TASK',
          link: `/tasks/${taskId}`,
        })
      )
    )

    return success(res, comment, 'Yorum eklendi', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Yorum eklenemedi', 500)
  }
}

// DELETE /api/tasks/:id/comments/:commentId
const deleteComment = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)
    const commentId = parseInt(req.params.commentId)
    if (Number.isNaN(taskId) || Number.isNaN(commentId)) return error(res, 'Geçersiz parametre', 400)

    const comment = await prisma.taskComment.findFirst({
      where: { id: commentId, taskId, deletedAt: null },
    })
    if (!comment) return error(res, 'Yorum bulunamadı', 404)

    if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return error(res, 'Bu yorumu silme yetkiniz yok', 403)
    }

    await prisma.taskComment.update({ where: { id: commentId }, data: { deletedAt: new Date() } })

    return success(res, null, 'Yorum silindi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Yorum silinemedi', 500)
  }
}

// GET /api/tasks/stats - Kullanıcıya özel görev özeti
const getStats = async (req, res) => {
  try {
    const now = new Date()
    const startToday = new Date(now); startToday.setHours(0, 0, 0, 0)
    const endToday = new Date(now); endToday.setHours(23, 59, 59, 999)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const mine = { assignedTo: req.user.id, deletedAt: null }
    const active = { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] }

    const [open, overdue, dueToday, completedThisWeek] = await Promise.all([
      prisma.task.count({ where: { ...mine, status: active } }),
      prisma.task.count({ where: { ...mine, status: active, dueDate: { lt: startToday } } }),
      prisma.task.count({ where: { ...mine, status: active, dueDate: { gte: startToday, lte: endToday } } }),
      prisma.task.count({ where: { ...mine, status: 'DONE', updatedAt: { gte: weekAgo } } }),
    ])

    return success(res, { open, overdue, dueToday, completedThisWeek }, 'İstatistikler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'İstatistikler getirilemedi', 500)
  }
}

// ============================================================
// KONTROL LİSTESİ (CHECKLIST / ALT GÖREV)
// ============================================================

// POST /api/tasks/:id/checklist
const addChecklistItem = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)
    const { text } = req.body
    if (Number.isNaN(taskId)) return error(res, 'Geçersiz görev', 400)

    const access = await ensureTaskAccess(taskId, req.user)
    if (access.error) return error(res, access.error, access.code)

    const count = await prisma.taskChecklistItem.count({ where: { taskId } })
    const item = await prisma.taskChecklistItem.create({
      data: { taskId, text: text.trim(), position: count },
      select: { id: true, text: true, isDone: true, position: true },
    })

    return success(res, item, 'Madde eklendi', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Madde eklenemedi', 500)
  }
}

// PATCH /api/tasks/:id/checklist/:itemId  (isDone ve/veya text)
const updateChecklistItem = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)
    const itemId = parseInt(req.params.itemId)
    const { isDone, text } = req.body
    if (Number.isNaN(taskId) || Number.isNaN(itemId)) return error(res, 'Geçersiz parametre', 400)

    const access = await ensureTaskAccess(taskId, req.user)
    if (access.error) return error(res, access.error, access.code)

    const existing = await prisma.taskChecklistItem.findFirst({ where: { id: itemId, taskId } })
    if (!existing) return error(res, 'Madde bulunamadı', 404)

    const item = await prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: {
        ...(typeof isDone === 'boolean' && { isDone }),
        ...(text !== undefined && { text: text.trim() }),
      },
      select: { id: true, text: true, isDone: true, position: true },
    })

    return success(res, item, 'Madde güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Madde güncellenemedi', 500)
  }
}

// DELETE /api/tasks/:id/checklist/:itemId
const deleteChecklistItem = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)
    const itemId = parseInt(req.params.itemId)
    if (Number.isNaN(taskId) || Number.isNaN(itemId)) return error(res, 'Geçersiz parametre', 400)

    const access = await ensureTaskAccess(taskId, req.user)
    if (access.error) return error(res, access.error, access.code)

    const existing = await prisma.taskChecklistItem.findFirst({ where: { id: itemId, taskId } })
    if (!existing) return error(res, 'Madde bulunamadı', 404)

    await prisma.taskChecklistItem.delete({ where: { id: itemId } })
    return success(res, null, 'Madde silindi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Madde silinemedi', 500)
  }
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getAssignableUsers,
  addComment,
  deleteComment,
  getStats,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
}

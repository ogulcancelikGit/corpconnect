const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')
const { getIO } = require('../config/socket')
const { createNotification } = require('./notification.controller')

const MSG_SELECT = {
  id: true,
  conversationId: true,
  content: true,
  status: true,
  isEdited: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  replyToId: true,
  pinnedAt: true,
  pinnedBy: true,
  forwardedFromId: true,
  sender: { select: { id: true, firstName: true, lastName: true, profile: { select: { avatar: true } } } },
  replyTo: {
    select: {
      id: true,
      content: true,
      deletedAt: true,
      sender: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  forwardedFrom: {
    select: {
      id: true,
      content: true,
      sender: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  files: { select: { file: { select: { id: true, originalName: true, mimeType: true, fileSize: true, filePath: true } } } },
  reactions: { select: { id: true, emoji: true, userId: true, user: { select: { id: true, firstName: true } } } },
}

// GET /api/conversations/:id/messages
const getMessages = async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 30 } = req.query
    const { take, skip } = getPagination(page, limit)

    const isMember = await prisma.conversationMember.findFirst({
      where: { conversationId: parseInt(id), userId: req.user.id },
    })

    if (!isMember) {
      return error(res, 'Bu konuşmaya erişim yetkiniz yok', 403)
    }

    const where = { conversationId: parseInt(id) }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, select: MSG_SELECT }),
      prisma.message.count({ where }),
    ])

    return paginated(
      res,
      messages.reverse(),
      getPaginationMeta(total, page, limit),
      'Mesajlar getirildi'
    )
  } catch (err) {
    logger.error(err)
    return error(res, 'Mesajlar getirilemedi', 500)
  }
}

// POST /api/conversations/:id/messages
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params
    const { content, fileIds, replyToId } = req.body

    if (!content && (!fileIds || fileIds.length === 0)) {
      return error(res, 'Mesaj içeriği veya dosya gerekli', 400)
    }

    const isMember = await prisma.conversationMember.findFirst({
      where: { conversationId: parseInt(id), userId: req.user.id },
    })

    if (!isMember) {
      return error(res, 'Bu konuşmaya mesaj gönderme yetkiniz yok', 403)
    }

    const message = await prisma.message.create({
      data: {
        conversationId: parseInt(id),
        senderId: req.user.id,
        content: content || null,
        status: 'SENT',
        ...(replyToId && { replyToId: parseInt(replyToId) }),
        ...(fileIds && fileIds.length > 0 && {
          files: { create: fileIds.map((fileId) => ({ fileId: parseInt(fileId) })) },
        }),
      },
      select: MSG_SELECT,
    })

    await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: { lastMessageAt: new Date() },
    })

    try {
      const io = getIO()
      io.to(`conversation:${id}`).emit('message:receive', message)
    } catch (e) {}

    // Mention bildirimleri
    const mentionRegex = /@\[(\d+)\]/g
    const mentionIds = [...(content?.matchAll(mentionRegex) || [])].map((m) => parseInt(m[1]))
    const uniqueMentions = [...new Set(mentionIds)].filter((uid) => uid !== req.user.id)
    for (const mentionedUserId of uniqueMentions) {
      await createNotification({
        userId: mentionedUserId,
        title: 'Sizi etiketledi',
        body: `${message.sender.firstName} ${message.sender.lastName} bir mesajda sizi etiketledi`,
        type: 'MENTION',
        link: '/messages',
      })
    }

    // Reply bildirimi — yanıtlanan mesajın sahibine (kendisi değilse ve mention edilmediyse)
    if (replyToId && message.replyTo?.sender) {
      const replyTargetUserId = message.replyTo.sender.id
      if (replyTargetUserId !== req.user.id && !uniqueMentions.includes(replyTargetUserId)) {
        await createNotification({
          userId: replyTargetUserId,
          title: `${message.sender.firstName} mesajınıza yanıt verdi`,
          body: (content || '').slice(0, 100) || 'Dosya gönderdi',
          type: 'MESSAGE',
          link: '/messages',
        })
      }
    }

    return success(res, message, 'Mesaj gönderildi', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Mesaj gönderilemedi', 500)
  }
}

// PUT /api/conversations/:id/messages/:msgId
const updateMessage = async (req, res) => {
  try {
    const { msgId } = req.params
    const { content } = req.body

    const existing = await prisma.message.findFirst({
      where: { id: parseInt(msgId), deletedAt: null },
    })

    if (!existing) {
      return error(res, 'Mesaj bulunamadı', 404)
    }

    if (existing.senderId !== req.user.id) {
      return error(res, 'Bu mesajı düzenleme yetkiniz yok', 403)
    }

    const message = await prisma.message.update({
      where: { id: parseInt(msgId) },
      data: { content, isEdited: true },
      select: {
        id: true,
        content: true,
        isEdited: true,
        updatedAt: true,
      },
    })

    try {
      const io = getIO()
      io.to(`conversation:${existing.conversationId}`).emit('message:edit', message)
    } catch (e) {}

    return success(res, message, 'Mesaj güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Mesaj güncellenemedi', 500)
  }
}

// DELETE /api/conversations/:id/messages/:msgId
const deleteMessage = async (req, res) => {
  try {
    const { msgId } = req.params

    const existing = await prisma.message.findFirst({
      where: { id: parseInt(msgId), deletedAt: null },
    })

    if (!existing) {
      return error(res, 'Mesaj bulunamadı', 404)
    }

    if (existing.senderId !== req.user.id && req.user.role !== 'ADMIN') {
      return error(res, 'Bu mesajı silme yetkiniz yok', 403)
    }

    await prisma.message.update({
      where: { id: parseInt(msgId) },
      data: { deletedAt: new Date(), content: 'Bu mesaj silindi' },
    })

    try {
      const io = getIO()
      io.to(`conversation:${existing.conversationId}`).emit('message:delete', { id: parseInt(msgId) })
    } catch (e) {}

    return success(res, null, 'Mesaj silindi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Mesaj silinemedi', 500)
  }
}

// PATCH /api/conversations/:id/read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.conversationMember.updateMany({
      where: { conversationId: parseInt(id), userId: req.user.id },
      data: { lastReadAt: new Date() },
    })

    await prisma.message.updateMany({
      where: {
        conversationId: parseInt(id),
        senderId: { not: req.user.id },
        status: { not: 'READ' },
      },
      data: { status: 'READ', readAt: new Date() },
    })

    return success(res, null, 'Mesajlar okundu olarak işaretlendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Mesajlar işaretlenemedi', 500)
  }
}

// GET /api/conversations/:id/messages/search?q=...
const searchMessages = async (req, res) => {
  try {
    const { id } = req.params
    const { q } = req.query

    if (!q || q.trim().length < 2) {
      return error(res, 'En az 2 karakter girin', 400)
    }

    const isMember = await prisma.conversationMember.findFirst({
      where: { conversationId: parseInt(id), userId: req.user.id },
    })

    if (!isMember) {
      return error(res, 'Bu konuşmaya erişim yetkiniz yok', 403)
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: parseInt(id),
        deletedAt: null,
        content: { contains: q },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: MSG_SELECT,
    })

    return success(res, messages.reverse(), 'Arama sonuçları')
  } catch (err) {
    logger.error(err)
    return error(res, 'Arama yapılamadı', 500)
  }
}

// PATCH /api/conversations/:id/messages/:msgId/pin
const pinMessage = async (req, res) => {
  try {
    const { id, msgId } = req.params

    const isMember = await prisma.conversationMember.findFirst({
      where: { conversationId: parseInt(id), userId: req.user.id },
    })

    if (!isMember) {
      return error(res, 'Bu konuşmaya erişim yetkiniz yok', 403)
    }

    const msg = await prisma.message.findFirst({
      where: { id: parseInt(msgId), conversationId: parseInt(id), deletedAt: null },
    })

    if (!msg) {
      return error(res, 'Mesaj bulunamadı', 404)
    }

    const isPinned = !!msg.pinnedAt
    const updated = await prisma.message.update({
      where: { id: parseInt(msgId) },
      data: isPinned
        ? { pinnedAt: null, pinnedBy: null }
        : { pinnedAt: new Date(), pinnedBy: req.user.id },
      select: { id: true, pinnedAt: true, pinnedBy: true },
    })

    try {
      const io = getIO()
      io.to(`conversation:${id}`).emit('message:pin', { messageId: parseInt(msgId), pinnedAt: updated.pinnedAt })
    } catch (e) {}

    return success(res, updated, isPinned ? 'Sabitleme kaldırıldı' : 'Mesaj sabitlendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'İşlem başarısız', 500)
  }
}

// GET /api/conversations/:id/pinned
const getPinnedMessages = async (req, res) => {
  try {
    const { id } = req.params

    const isMember = await prisma.conversationMember.findFirst({
      where: { conversationId: parseInt(id), userId: req.user.id },
    })

    if (!isMember) {
      return error(res, 'Bu konuşmaya erişim yetkiniz yok', 403)
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: parseInt(id), pinnedAt: { not: null }, deletedAt: null },
      orderBy: { pinnedAt: 'desc' },
      select: MSG_SELECT,
    })

    return success(res, messages, 'Sabitlenmiş mesajlar')
  } catch (err) {
    logger.error(err)
    return error(res, 'Sabitlenmiş mesajlar getirilemedi', 500)
  }
}

// POST /api/conversations/:id/messages/forward
const forwardMessage = async (req, res) => {
  try {
    const { id } = req.params
    const { messageId } = req.body

    if (!messageId) {
      return error(res, 'messageId gerekli', 400)
    }

    const original = await prisma.message.findUnique({
      where: { id: parseInt(messageId) },
      include: { files: true },
    })

    if (!original || original.deletedAt) {
      return error(res, 'Kaynak mesaj bulunamadı', 404)
    }

    const isMember = await prisma.conversationMember.findFirst({
      where: { conversationId: parseInt(id), userId: req.user.id },
    })

    if (!isMember) {
      return error(res, 'Hedef konuşmaya erişim yetkiniz yok', 403)
    }

    const forwarded = await prisma.message.create({
      data: {
        conversationId: parseInt(id),
        senderId: req.user.id,
        content: original.content,
        forwardedFromId: original.id,
        status: 'SENT',
        ...(original.files.length > 0 && {
          files: { create: original.files.map((f) => ({ fileId: f.fileId })) },
        }),
      },
      select: MSG_SELECT,
    })

    await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: { lastMessageAt: new Date() },
    })

    try {
      const io = getIO()
      io.to(`conversation:${id}`).emit('message:receive', forwarded)
    } catch (e) {}

    return success(res, forwarded, 'Mesaj iletildi', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Mesaj iletilemedi', 500)
  }
}

module.exports = { getMessages, sendMessage, updateMessage, deleteMessage, markAsRead, searchMessages, pinMessage, getPinnedMessages, forwardMessage }
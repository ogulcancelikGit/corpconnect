const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')
const { getIO } = require('../config/socket')

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
      prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          content: true,
          status: true,
          isEdited: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profile: { select: { avatar: true } },
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
      }),
      prisma.message.count({ where }),
    ])

    return paginated(
      res,
      messages.reverse(),
      getPaginationMeta(total, page, limit),
      'Mesajlar getirildi'
    )
  } catch (err) {
    console.error(err)
    return error(res, 'Mesajlar getirilemedi', 500)
  }
}

// POST /api/conversations/:id/messages
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params
    const { content, fileIds } = req.body

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
        ...(fileIds && fileIds.length > 0 && {
          files: {
            create: fileIds.map((fileId) => ({ fileId: parseInt(fileId) })),
          },
        }),
      },
      select: {
        id: true,
        conversationId: true,
        content: true,
        status: true,
        isEdited: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: { select: { avatar: true } },
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

    await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: { lastMessageAt: new Date() },
    })

    try {
      const io = getIO()
      io.to(`conversation:${id}`).emit('message:receive', message)
    } catch (e) {}

    return success(res, message, 'Mesaj gönderildi', 201)
  } catch (err) {
    console.error(err)
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
    console.error(err)
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
    console.error(err)
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
    console.error(err)
    return error(res, 'Mesajlar işaretlenemedi', 500)
  }
}

module.exports = { getMessages, sendMessage, updateMessage, deleteMessage, markAsRead }
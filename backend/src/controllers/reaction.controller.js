const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error } = require('../utils/response.util')
const { getIO } = require('../config/socket')
const { createNotification } = require('./notification.controller')

const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

// POST /api/conversations/:convId/messages/:msgId/reactions
const toggleReaction = async (req, res) => {
  try {
    const { convId, msgId } = req.params
    const { emoji } = req.body

    if (!ALLOWED_EMOJIS.includes(emoji)) {
      return error(res, 'Geçersiz emoji', 400)
    }

    const isMember = await prisma.conversationMember.findFirst({
      where: { conversationId: parseInt(convId), userId: req.user.id },
    })

    if (!isMember) {
      return error(res, 'Bu konuşmaya erişim yetkiniz yok', 403)
    }

    const existing = await prisma.messageReaction.findFirst({
      where: { messageId: parseInt(msgId), userId: req.user.id, emoji },
    })

    let added = false
    if (existing) {
      await prisma.messageReaction.delete({ where: { id: existing.id } })
    } else {
      await prisma.messageReaction.create({
        data: { messageId: parseInt(msgId), userId: req.user.id, emoji },
      })
      added = true
    }

    const reactions = await prisma.messageReaction.findMany({
      where: { messageId: parseInt(msgId) },
      select: { id: true, emoji: true, userId: true, user: { select: { id: true, firstName: true } } },
    })

    try {
      const io = getIO()
      io.to(`conversation:${convId}`).emit('message:reaction', { messageId: parseInt(msgId), reactions })
    } catch (e) {}

    // Reaksiyon eklendiğinde mesaj sahibine bildirim (kendi mesajına ise gönderme)
    if (added) {
      const message = await prisma.message.findUnique({
        where: { id: parseInt(msgId) },
        select: {
          senderId: true,
          content: true,
          sender: { select: { firstName: true } },
        },
      })
      if (message && message.senderId !== req.user.id) {
        await createNotification({
          userId: message.senderId,
          title: `${req.user.firstName} ${emoji} ile tepki verdi`,
          body: (message.content || '').slice(0, 80) || 'Mesajınıza tepki verildi',
          type: 'MESSAGE',
          link: '/messages',
        })
      }
    }

    return success(res, { messageId: parseInt(msgId), reactions }, 'Reaksiyon güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Reaksiyon güncellenemedi', 500)
  }
}

module.exports = { toggleReaction }

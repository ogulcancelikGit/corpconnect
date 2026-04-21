const prisma = require('../../config/database')

const messageHandler = (io, socket) => {
  socket.on('conversation:join', async (conversationId) => {
    try {
      const isMember = await prisma.conversationMember.findFirst({
        where: {
          conversationId: parseInt(conversationId),
          userId: socket.user.id,
        },
      })

      if (isMember) {
        socket.join(`conversation:${conversationId}`)
        console.log(`${socket.user.email} konuşmaya katıldı: ${conversationId}`)
      }
    } catch (err) {
      console.error('conversation:join hatası:', err)
    }
  })

  socket.on('conversation:leave', (conversationId) => {
    socket.leave(`conversation:${conversationId}`)
    console.log(`${socket.user.email} konuşmadan ayrıldı: ${conversationId}`)
  })

  socket.on('message:read', async ({ conversationId }) => {
    try {
      await prisma.message.updateMany({
        where: {
          conversationId: parseInt(conversationId),
          senderId: { not: socket.user.id },
          status: { not: 'READ' },
        },
        data: { status: 'READ', readAt: new Date() },
      })

      socket.to(`conversation:${conversationId}`).emit('message:read', {
        conversationId,
        userId: socket.user.id,
      })
    } catch (err) {
      console.error('message:read hatası:', err)
    }
  })
}

module.exports = messageHandler
const typingHandler = (io, socket) => {
  socket.on('typing:start', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      conversationId,
      userId: socket.user.id,
    })
  })

  socket.on('typing:stop', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
      conversationId,
      userId: socket.user.id,
    })
  })
}

module.exports = typingHandler
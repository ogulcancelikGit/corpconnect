const notificationHandler = (io, socket) => {
  socket.on('notification:read', ({ notificationId }) => {
    socket.to(`user:${socket.user.id}`).emit('notification:read', { notificationId })
  })
}

module.exports = notificationHandler
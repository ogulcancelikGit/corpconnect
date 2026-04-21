const pollHandler = (io, socket) => {
  socket.on('poll:join', (pollId) => {
    socket.join(`poll:${pollId}`)
  })

  socket.on('poll:leave', (pollId) => {
    socket.leave(`poll:${pollId}`)
  })
}

module.exports = pollHandler
const { Server } = require('socket.io')
const { verifyAccessToken } = require('../utils/jwt.util')
const prisma = require('./database')

let io

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Token bulunamadı'))
      }

      const decoded = verifyAccessToken(token)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      })

      if (!user || !user.isActive) {
        return next(new Error('Yetkisiz erişim'))
      }

      socket.user = user
      next()
    } catch (err) {
      next(new Error('Geçersiz token'))
    }
  })

  const { initHandlers } = require('../socket/index')
  initHandlers(io)

  console.log('Socket.IO başlatıldı')
  return io
}

const getIO = () => {
  if (!io) throw new Error('Socket.IO başlatılmadı')
  return io
}

module.exports = { initSocket, getIO }
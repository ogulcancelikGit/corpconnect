const messageHandler = require('./handlers/message.handler')
const typingHandler = require('./handlers/typing.handler')
const notificationHandler = require('./handlers/notification.handler')
const pollHandler = require('./handlers/poll.handler')
const prisma = require('../config/database')
const logger = require('../utils/logger')

const onlineUsers = new Map()

const initHandlers = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Kullanıcı bağlandı: ${socket.user.email}`)

    // Kullanıcıyı kendi odasına ekle (bildirimler için)
    socket.join(`user:${socket.user.id}`)

    // Online kullanıcıya ekle
    onlineUsers.set(socket.user.id, socket.id)

    // Online olduğunu herkese bildir
    io.emit('user:online', { userId: socket.user.id })

    // Handler'ları başlat
    messageHandler(io, socket)
    typingHandler(io, socket)
    notificationHandler(io, socket)
    pollHandler(io, socket)

    // Bağlantı kesilince
    socket.on('disconnect', () => {
      logger.info(`Kullanıcı ayrıldı: ${socket.user.email}`)
      onlineUsers.delete(socket.user.id)
      io.emit('user:offline', { userId: socket.user.id })
    })
  })
}

const getOnlineUsers = () => Array.from(onlineUsers.keys())

module.exports = { initHandlers, getOnlineUsers }
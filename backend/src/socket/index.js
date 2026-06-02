const messageHandler = require('./handlers/message.handler')
const typingHandler = require('./handlers/typing.handler')
const notificationHandler = require('./handlers/notification.handler')
const pollHandler = require('./handlers/poll.handler')
const prisma = require('../config/database')
const logger = require('../utils/logger')

// userId -> aktif socket id kümesi (aynı kullanıcının birden çok sekmesi olabilir)
const onlineUsers = new Map()

const initHandlers = (io) => {
  io.on('connection', (socket) => {
    const uid = socket.user.id
    logger.info(`Kullanıcı bağlandı: ${socket.user.email}`)

    // Kullanıcıyı kendi odasına ekle (bildirimler için)
    socket.join(`user:${uid}`)

    // Online kümesine ekle; bu kullanıcı için ilk bağlantı mı?
    const wasOffline = !onlineUsers.has(uid) || onlineUsers.get(uid).size === 0
    if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set())
    onlineUsers.get(uid).add(socket.id)

    // Yeni bağlanan sokete o an online olan herkesin listesini gönder
    socket.emit('user:online:list', Array.from(onlineUsers.keys()))

    // Bu kullanıcı yeni online olduysa herkese bildir (zaten online'sa tekrar gönderme)
    if (wasOffline) io.emit('user:online', { userId: uid })

    // Handler'ları başlat
    messageHandler(io, socket)
    typingHandler(io, socket)
    notificationHandler(io, socket)
    pollHandler(io, socket)

    // Bağlantı kesilince — yalnızca kullanıcının SON sekmesi de kapanınca offline yap
    socket.on('disconnect', () => {
      logger.info(`Kullanıcı ayrıldı: ${socket.user.email}`)
      const set = onlineUsers.get(uid)
      if (!set) return
      set.delete(socket.id)
      if (set.size === 0) {
        onlineUsers.delete(uid)
        io.emit('user:offline', { userId: uid })
      }
    })
  })
}

const getOnlineUsers = () => Array.from(onlineUsers.keys())

module.exports = { initHandlers, getOnlineUsers }
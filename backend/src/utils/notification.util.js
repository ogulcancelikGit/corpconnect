const prisma = require('../config/database')
const logger = require('./logger')

const emitToUsers = (userIds, payload) => {
  try {
    const { getIO } = require('../config/socket')
    const io = getIO()
    userIds.forEach((id) => {
      io.to(`user:${id}`).emit('notification:new', payload)
    })
  } catch (e) {}
}

const insertAndEmit = async ({ userIds, title, body, type, link }) => {
  if (!userIds || userIds.length === 0) return 0

  const data = userIds.map((userId) => ({
    userId,
    title,
    body,
    type,
    link: link || null,
  }))

  try {
    await prisma.notification.createMany({ data })
    emitToUsers(userIds, { title, body, type, link, createdAt: new Date() })
    return userIds.length
  } catch (err) {
    logger.error('Bildirim toplu gönderimi başarısız', { err })
    return 0
  }
}

const notifyAll = async ({ title, body, type, link, excludeUserId, roles }) => {
  const where = {
    isActive: true,
    deletedAt: null,
  }
  if (excludeUserId) where.id = { not: excludeUserId }
  if (roles && roles.length > 0) where.role = { in: roles }

  const users = await prisma.user.findMany({ where, select: { id: true } })
  return insertAndEmit({ userIds: users.map((u) => u.id), title, body, type, link })
}

const notifyUsers = async ({ userIds, title, body, type, link }) => {
  return insertAndEmit({ userIds, title, body, type, link })
}

const notifyManagers = async ({ title, body, type, link, excludeUserId }) => {
  return notifyAll({ title, body, type, link, excludeUserId, roles: ['ADMIN', 'MANAGER'] })
}

module.exports = { notifyAll, notifyUsers, notifyManagers }

const prisma = require('../config/database')

const log = async ({ userId, action, entity, entityId, detail, ip }) => {
  try {
    await prisma.activityLog.create({
      data: { userId, action, entity, entityId, detail, ip: ip || null },
    })
  } catch {
    // Log hatası asıl işlemi engellemez
  }
}

module.exports = { log }

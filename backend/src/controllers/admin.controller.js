const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')
const { log } = require('../utils/activityLog.util')
const { hashPassword } = require('../utils/bcrypt.util')
const { setMaintenanceMode } = require('../middleware/maintenance.middleware')

// GET /api/admin/users
const getAdminUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = {
      ...(role && { role }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              avatar: true,
              department: true,
              position: true,
              phone: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return paginated(res, users, getPaginationMeta(total, page, limit), 'Kullanıcılar getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Kullanıcılar getirilemedi', 500)
  }
}

// GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const now = new Date()

    const [
      totalUsers,
      activeUsers,
      adminCount,
      managerCount,
      employeeCount,
      totalNews,
      totalPolls,
      activePolls,
      totalTrainings,
      totalMessages,
      totalFiles,
      totalNotifications,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, isActive: true } }),
      prisma.user.count({ where: { deletedAt: null, role: 'ADMIN' } }),
      prisma.user.count({ where: { deletedAt: null, role: 'MANAGER' } }),
      prisma.user.count({ where: { deletedAt: null, role: 'EMPLOYEE' } }),
      prisma.news.count({ where: { deletedAt: null } }),
      prisma.poll.count({ where: { deletedAt: null } }),
      prisma.poll.count({
        where: {
          deletedAt: null,
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }),
      prisma.training.count({ where: { deletedAt: null } }),
      prisma.message.count({ where: { deletedAt: null } }),
      prisma.file.count({ where: { deletedAt: null } }),
      prisma.notification.count(),
    ])

    return success(res, {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: {
          admin: adminCount,
          manager: managerCount,
          employee: employeeCount,
        },
      },
      content: {
        news: totalNews,
        polls: totalPolls,
        activePolls,
        trainings: totalTrainings,
      },
      activity: {
        messages: totalMessages,
        files: totalFiles,
        notifications: totalNotifications,
      },
    }, 'Sistem istatistikleri getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'İstatistikler getirilemedi', 500)
  }
}

// GET /api/admin/settings
const getSettings = async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findMany({
      orderBy: { settingKey: 'asc' },
    })

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.settingKey] = setting.settingValue
      return acc
    }, {})

    return success(res, settingsMap, 'Sistem ayarları getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Sistem ayarları getirilemedi', 500)
  }
}

// PUT /api/admin/settings
const updateSettings = async (req, res) => {
  try {
    const settings = req.body

    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.systemSettings.upsert({
          where: { settingKey: key },
          update: { settingValue: String(value) },
          create: { settingKey: key, settingValue: String(value) },
        })
      )
    )

    // Bakım modu değiştiyse bellekteki bayrağı anında güncelle
    if (Object.prototype.hasOwnProperty.call(settings, 'maintenance_mode')) {
      setMaintenanceMode(settings.maintenance_mode)
    }

    return success(res, null, 'Sistem ayarları güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Sistem ayarları güncellenemedi', 500)
  }
}

// GET /api/admin/logs
const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const { take, skip } = getPagination(page, limit)

    const [logs, total] = await Promise.all([
      prisma.refreshToken.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          revokedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      prisma.refreshToken.count(),
    ])

    return paginated(res, logs, getPaginationMeta(total, page, limit), 'Loglar getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Loglar getirilemedi', 500)
  }
}

// PATCH /api/admin/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    if (parseInt(id) === req.user.id) {
      return error(res, 'Kendi hesabınızı devre dışı bırakamazsınız', 400)
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive },
      select: { id: true, firstName: true, lastName: true, isActive: true },
    })

    log({ userId: req.user.id, action: 'USER_STATUS_CHANGE', entity: 'User', entityId: parseInt(id), detail: `${user.firstName} ${user.lastName} ${isActive ? 'aktif edildi' : 'devre dışı bırakıldı'}`, ip: req.ip })

    return success(res, user, `Kullanıcı ${isActive ? 'aktif edildi' : 'devre dışı bırakıldı'}`)
  } catch (err) {
    logger.error(err)
    return error(res, 'İşlem gerçekleştirilemedi', 500)
  }
}

// PATCH /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) {
      return error(res, 'Geçersiz rol', 400)
    }

    if (parseInt(id) === req.user.id) {
      return error(res, 'Kendi rolünüzü değiştiremezsiniz', 400)
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: { id: true, firstName: true, lastName: true, role: true },
    })

    log({ userId: req.user.id, action: 'USER_ROLE_CHANGE', entity: 'User', entityId: parseInt(id), detail: `${user.firstName} ${user.lastName} rolü ${role} yapıldı`, ip: req.ip })

    return success(res, user, 'Rol güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Rol güncellenemedi', 500)
  }
}

// POST /api/admin/users
const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'EMPLOYEE', department, position, phone } = req.body

    if (!email || !password || !firstName || !lastName) {
      return error(res, 'E-posta, şifre, ad ve soyad zorunludur', 400)
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return error(res, 'Bu e-posta adresi zaten kullanımda', 409)

    const hashed = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        firstName,
        lastName,
        role,
        emailVerified: true,
        profile: {
          create: {
            ...(department && { department }),
            ...(position && { position }),
            ...(phone && { phone }),
          },
        },
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, createdAt: true,
        profile: { select: { department: true, position: true } },
      },
    })

    log({ userId: req.user.id, action: 'USER_CREATED', entity: 'User', entityId: user.id, detail: `${firstName} ${lastName} (${email}) oluşturuldu`, ip: req.ip })

    return success(res, user, 'Kullanıcı oluşturuldu', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Kullanıcı oluşturulamadı', 500)
  }
}

module.exports = {
  getAdminUsers,
  getAdminStats,
  getSettings,
  updateSettings,
  getLogs,
  updateUserStatus,
  updateUserRole,
  createUser,
}
const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')
const { hashPassword, comparePassword } = require('../utils/bcrypt.util')
const fs = require('fs')
const path = require('path')

// GET /api/users/me
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        profile: true,
      },
    })

    return success(res, user, 'Profil getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Profil getirilemedi', 500)
  }
}

// PUT /api/users/me
const updateMe = async (req, res) => {
  try {
    const { firstName, lastName, phone, department, position, bio, birthDate, hireDate } = req.body

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        profile: {
          update: {
            ...(phone !== undefined && { phone }),
            ...(department !== undefined && { department }),
            ...(position !== undefined && { position }),
            ...(bio !== undefined && { bio }),
            ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
            ...(hireDate !== undefined && { hireDate: hireDate ? new Date(hireDate) : null }),
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
        profile: true,
      },
    })

    return success(res, user, 'Profil güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Profil güncellenemedi', 500)
  }
}

// POST /api/users/me/avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, 'Dosya bulunamadı', 400)
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { profile: { select: { avatar: true } } },
    })

    if (user?.profile?.avatar) {
      const oldPath = path.resolve(user.profile.avatar)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }

    const avatarPath = req.file.path.replace(/\\/g, '/')

    await prisma.userProfile.update({
      where: { userId: req.user.id },
      data: { avatar: avatarPath },
    })

    return success(res, { avatar: avatarPath }, 'Avatar güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Avatar güncellenemedi', 500)
  }
}

// DELETE /api/users/me/avatar
const deleteAvatar = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { profile: { select: { avatar: true } } },
    })

    if (user?.profile?.avatar) {
      const oldPath = path.resolve(user.profile.avatar)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }

    await prisma.userProfile.update({
      where: { userId: req.user.id },
      data: { avatar: null },
    })

    return success(res, null, 'Avatar silindi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Avatar silinemedi', 500)
  }
}

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = {
      deletedAt: null,
      ...(role && { role }),
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
          lastLoginAt: true,
          createdAt: true,
          profile: {
            select: {
              avatar: true,
              department: true,
              position: true,
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

// GET /api/users/search
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query

    if (!q || q.length < 2) {
      return error(res, 'En az 2 karakter girin', 400)
    }

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        id: { not: req.user.id },
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profile: {
          select: { avatar: true, department: true, position: true },
        },
      },
    })

    return success(res, users, 'Kullanıcılar bulundu')
  } catch (err) {
    logger.error(err)
    return error(res, 'Kullanıcı araması yapılamadı', 500)
  }
}

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findFirst({
      where: { id: parseInt(id), deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        profile: true,
      },
    })

    if (!user) {
      return error(res, 'Kullanıcı bulunamadı', 404)
    }

    return success(res, user, 'Kullanıcı getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Kullanıcı getirilemedi', 500)
  }
}

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { firstName, lastName, department, position } = req.body

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        profile: {
          update: {
            ...(department !== undefined && { department }),
            ...(position !== undefined && { position }),
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        profile: true,
      },
    })

    return success(res, user, 'Kullanıcı güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Kullanıcı güncellenemedi', 500)
  }
}

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    if (parseInt(id) === req.user.id) {
      return error(res, 'Kendi hesabınızı silemezsiniz', 400)
    }

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date(), isActive: false },
    })

    return success(res, null, 'Kullanıcı silindi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Kullanıcı silinemedi', 500)
  }
}

// PATCH /api/users/:id/role
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
      select: { id: true, email: true, role: true },
    })

    return success(res, user, 'Kullanıcı rolü güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Kullanıcı rolü güncellenemedi', 500)
  }
}

// PATCH /api/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    if (parseInt(id) === req.user.id) {
      return error(res, 'Kendi hesabınızın durumunu değiştiremezsiniz', 400)
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    })

    return success(res, user, `Kullanıcı ${isActive ? 'aktif' : 'pasif'} yapıldı`)
  } catch (err) {
    logger.error(err)
    return error(res, 'Kullanıcı durumu güncellenemedi', 500)
  }
}

module.exports = {
  getMe,
  updateMe,
  uploadAvatar,
  deleteAvatar,
  getUsers,
  searchUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
}
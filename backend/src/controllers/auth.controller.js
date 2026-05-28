const prisma = require('../config/database')
const { hashPassword, comparePassword } = require('../utils/bcrypt.util')
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.util')
const { success, error } = require('../utils/response.util')
const { log } = require('../utils/activityLog.util')
const logger = require('../utils/logger.util')
const crypto = require('crypto')

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return error(res, 'Bu email adresi zaten kullanımda', 409)
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        profile: { create: {} },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    })

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return success(res, { user, accessToken, refreshToken }, 'Kayıt başarılı', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Kayıt sırasında hata oluştu', 500)
  }
}

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        deletedAt: true,
      },
    })

    if (!user) {
      return error(res, 'Email veya şifre hatalı', 401)
    }

    if (!user.isActive || user.deletedAt) {
      return error(res, 'Hesabınız aktif değil', 401)
    }

    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      return error(res, 'Email veya şifre hatalı', 401)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const { password: _, ...userWithoutPassword } = user

    log({ userId: user.id, action: 'LOGIN', detail: `${user.email} giriş yaptı`, ip: req.ip })

    return success(res, { user: userWithoutPassword, accessToken, refreshToken }, 'Giriş başarılı')
  } catch (err) {
    logger.error(err)
    return error(res, 'Giriş sırasında hata oluştu', 500)
  }
}

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: {
          token: refreshToken,
          userId: req.user.id,
        },
        data: { revokedAt: new Date() },
      })
    }

    return success(res, null, 'Çıkış başarılı')
  } catch (err) {
    logger.error(err)
    return error(res, 'Çıkış sırasında hata oluştu', 500)
  }
}

// POST /api/auth/refresh
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return error(res, 'Refresh token bulunamadı', 401)
    }

    const decoded = verifyRefreshToken(refreshToken)

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      return error(res, 'Geçersiz veya süresi dolmuş token', 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return error(res, 'Kullanıcı bulunamadı', 401)
    }

    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    })

    const newAccessToken = generateAccessToken(user)
    const newRefreshToken = generateRefreshToken(user)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return success(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, 'Token yenilendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Token yenileme hatası', 500)
  }
}

// GET /api/auth/me
const me = async (req, res) => {
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

    return success(res, user, 'Kullanıcı bilgisi getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Kullanıcı bilgisi getirilemedi', 500)
  }
}

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return success(res, null, 'Şifre sıfırlama maili gönderildi')
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    })

    logger.debug(`Şifre sıfırlama token: ${token}`)

    return success(res, null, 'Şifre sıfırlama maili gönderildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Şifre sıfırlama hatası', 500)
  }
}

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!passwordReset || passwordReset.usedAt || passwordReset.expiresAt < new Date()) {
      return error(res, 'Geçersiz veya süresi dolmuş token', 400)
    }

    const hashedPassword = await hashPassword(password)

    await prisma.user.update({
      where: { id: passwordReset.userId },
      data: { password: hashedPassword },
    })

    await prisma.passwordReset.update({
      where: { token },
      data: { usedAt: new Date() },
    })

    await prisma.refreshToken.updateMany({
      where: { userId: passwordReset.userId },
      data: { revokedAt: new Date() },
    })

    return success(res, null, 'Şifre başarıyla sıfırlandı')
  } catch (err) {
    logger.error(err)
    return error(res, 'Şifre sıfırlama hatası', 500)
  }
}

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, password: true },
    })

    const isValid = await comparePassword(currentPassword, user.password)
    if (!isValid) {
      return error(res, 'Mevcut şifre hatalı', 400)
    }

    const hashedPassword = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    })

    await prisma.refreshToken.updateMany({
      where: { userId: req.user.id },
      data: { revokedAt: new Date() },
    })

    return success(res, null, 'Şifre başarıyla değiştirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Şifre değiştirme hatası', 500)
  }
}

module.exports = {
  register,
  login,
  logout,
  refresh,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
}
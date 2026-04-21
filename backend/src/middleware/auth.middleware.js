const { verifyAccessToken } = require('../utils/jwt.util')
const { error } = require('../utils/response.util')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Token bulunamadı', 401)
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
      },
    })

    if (!user) {
      return error(res, 'Kullanıcı bulunamadı', 401)
    }

    if (!user.isActive || user.deletedAt) {
      return error(res, 'Hesap aktif değil', 401)
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token süresi doldu', 401)
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 'Geçersiz token', 401)
    }
    return error(res, 'Kimlik doğrulama hatası', 500)
  }
}

module.exports = { authenticate }
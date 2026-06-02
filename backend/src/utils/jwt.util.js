const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  )
}

const generateRefreshToken = (user) => {
  // jti: aynı kullanıcının aynı saniyede birden fazla login olması durumunda
  // birebir aynı token string'inin üretilip unique constraint'i (P2002) ihlal
  // etmesini önler.
  return jwt.sign(
    { userId: user.id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )
}

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET)
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
}
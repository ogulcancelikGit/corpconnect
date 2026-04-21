const { error } = require('../utils/response.util')

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Kimlik doğrulama gerekli', 401)
    }

    if (!roles.includes(req.user.role)) {
      return error(res, 'Bu işlem için yetkiniz yok', 403)
    }

    next()
  }
}

module.exports = { authorize }
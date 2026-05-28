const { error } = require('../utils/response.util')
const logger = require('../utils/logger')

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack)

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return error(res, 'Bu kayıt zaten mevcut', 409)
    }
    if (err.code === 'P2025') {
      return error(res, 'Kayıt bulunamadı', 404)
    }
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 'Dosya boyutu çok büyük', 400)
    }
    return error(res, err.message, 400)
  }

  if (err.message === 'Desteklenmeyen dosya tipi') {
    return error(res, err.message, 400)
  }

  const isProd = process.env.NODE_ENV === 'production'
  return error(
    res,
    isProd ? 'Sunucu hatası' : (err.message || 'Sunucu hatası'),
    err.statusCode || 500
  )
}

module.exports = { errorHandler }
const { validationResult } = require('express-validator')
const { error } = require('../utils/response.util')

const validate = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return error(
      res,
      'Doğrulama hatası',
      400,
      errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      }))
    )
  }

  next()
}

module.exports = { validate }
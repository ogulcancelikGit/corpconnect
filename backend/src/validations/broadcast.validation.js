const { body } = require('express-validator')

const sendBroadcastValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Başlık zorunludur')
    .isLength({ max: 255 }).withMessage('Başlık en fazla 255 karakter olabilir'),
  body('body')
    .trim()
    .notEmpty().withMessage('Mesaj zorunludur')
    .isLength({ max: 2000 }).withMessage('Mesaj en fazla 2000 karakter olabilir'),
  body('targetRoles')
    .optional()
    .isArray({ min: 1 }).withMessage('Hedef roller bir liste olmalıdır')
    .custom((roles) => {
      const valid = ['ADMIN', 'MANAGER', 'EMPLOYEE']
      if (!roles.every((r) => valid.includes(r))) {
        throw new Error('Geçersiz rol değeri')
      }
      return true
    }),
  body('link')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 }).withMessage('Bağlantı en fazla 500 karakter olabilir'),
]

module.exports = { sendBroadcastValidation }

const { body } = require('express-validator')

const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad en az 2, en fazla 50 karakter olmalı')
    .escape(),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyad en az 2, en fazla 50 karakter olmalı')
    .escape(),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Geçerli bir telefon numarası girin'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Departman en fazla 100 karakter olmalı')
    .escape(),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Pozisyon en fazla 100 karakter olmalı')
    .escape(),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Biyografi en fazla 500 karakter olmalı')
    .escape(),
]

module.exports = { updateProfileValidation }
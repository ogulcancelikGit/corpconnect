const { body } = require('express-validator')

const createLabelValidation = [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Etiket adı 1-50 karakter olmalı'),
  body('color')
    .optional()
    .matches(/^#[0-9a-fA-F]{6}$/)
    .withMessage('Renk #RRGGBB formatında olmalı'),
]

module.exports = { createLabelValidation }

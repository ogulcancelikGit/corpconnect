const { body } = require('express-validator')

const createNewsValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Başlık en az 5, en fazla 255 karakter olmalı')
    .escape(),
  body('content')
    .trim()
    .isLength({ min: 20 })
    .withMessage('İçerik en az 20 karakter olmalı'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Kategori en fazla 100 karakter olmalı')
    .escape(),
  body('isPinned')
    .optional()
    .isBoolean()
    .withMessage('isPinned true veya false olmalı'),
]

const updateNewsValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Başlık en az 5, en fazla 255 karakter olmalı')
    .escape(),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage('İçerik en az 20 karakter olmalı'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Kategori en fazla 100 karakter olmalı')
    .escape(),
  body('isPinned')
    .optional()
    .isBoolean()
    .withMessage('isPinned true veya false olmalı'),
]

module.exports = { createNewsValidation, updateNewsValidation }
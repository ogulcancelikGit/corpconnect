const { body } = require('express-validator')

const createTrainingValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Başlık en az 5, en fazla 255 karakter olmalı')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Açıklama en fazla 2000 karakter olmalı'),
  body('videoUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Geçerli bir video URL girin'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Kategori en fazla 100 karakter olmalı')
    .escape(),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Süre pozitif bir sayı olmalı'),
]

const updateTrainingValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Başlık en az 5, en fazla 255 karakter olmalı')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Açıklama en fazla 2000 karakter olmalı'),
  body('videoUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Geçerli bir video URL girin'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Kategori en fazla 100 karakter olmalı')
    .escape(),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Süre pozitif bir sayı olmalı'),
]

module.exports = { createTrainingValidation, updateTrainingValidation }
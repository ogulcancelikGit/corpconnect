const { body } = require('express-validator')

const createSuggestionValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Başlık zorunludur')
    .isLength({ max: 255 }).withMessage('Başlık en fazla 255 karakter olabilir'),
  body('content')
    .trim()
    .notEmpty().withMessage('İçerik zorunludur')
    .isLength({ max: 5000 }).withMessage('İçerik en fazla 5000 karakter olabilir'),
  body('category')
    .optional()
    .isIn(['PROCESS', 'TECHNOLOGY', 'CULTURE', 'SAFETY', 'OTHER'])
    .withMessage('Geçerli bir kategori seçin'),
  body('isAnonymous')
    .optional()
    .isBoolean().withMessage('isAnonymous boolean olmalıdır'),
]

const reviewSuggestionValidation = [
  body('status')
    .isIn(['UNDER_REVIEW', 'APPROVED', 'REJECTED'])
    .withMessage('Geçerli bir durum seçin'),
  body('adminNote')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Not en fazla 500 karakter olabilir'),
]

module.exports = { createSuggestionValidation, reviewSuggestionValidation }

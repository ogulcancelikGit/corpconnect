const { body } = require('express-validator')

const createExpenseValidation = [
  body('title').trim().isLength({ min: 2, max: 255 }).withMessage('Başlık 2-255 karakter olmalı'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Geçerli bir tutar girin'),
  body('category')
    .isIn(['TRAVEL', 'FOOD', 'ACCOMMODATION', 'OFFICE', 'OTHER'])
    .withMessage('Geçerli bir kategori seçin'),
  body('expenseDate').isISO8601().withMessage('Geçerli bir tarih girin'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('currency').optional().trim().isLength({ max: 10 }),
]

const reviewExpenseValidation = [
  body('status').isIn(['APPROVED', 'REJECTED']).withMessage('Geçerli bir durum girin'),
  body('reviewNote').optional().trim().isLength({ max: 500 }),
]

module.exports = { createExpenseValidation, reviewExpenseValidation }

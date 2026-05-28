const { body } = require('express-validator')

const createLeaveValidation = [
  body('type')
    .isIn(['ANNUAL', 'SICK', 'EXCUSE', 'UNPAID'])
    .withMessage('Geçerli bir izin türü seçin'),
  body('startDate')
    .isISO8601()
    .withMessage('Geçerli bir başlangıç tarihi girin'),
  body('endDate')
    .isISO8601()
    .withMessage('Geçerli bir bitiş tarihi girin')
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('Bitiş tarihi başlangıç tarihinden önce olamaz')
      }
      return true
    }),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Açıklama en fazla 500 karakter olabilir'),
]

const reviewLeaveValidation = [
  body('status')
    .isIn(['APPROVED', 'REJECTED'])
    .withMessage('Geçerli bir durum girin'),
  body('reviewNote')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Not en fazla 500 karakter olabilir'),
]

module.exports = { createLeaveValidation, reviewLeaveValidation }

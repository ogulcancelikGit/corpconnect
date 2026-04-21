const { body } = require('express-validator')

const createPollValidation = [
  body('question')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Soru en az 3, en fazla 500 karakter olmalı')
    .escape(),
  body('options')
    .isArray({ min: 2, max: 10 })
    .withMessage('En az 2, en fazla 10 seçenek girilmeli'),
  body('options.*')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Her seçenek en az 1, en fazla 255 karakter olmalı')
    .escape(),
  body('startDate')
    .isISO8601()
    .withMessage('Geçerli bir başlangıç tarihi girin'),
  body('endDate')
    .isISO8601()
    .withMessage('Geçerli bir bitiş tarihi girin')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('Bitiş tarihi başlangıç tarihinden sonra olmalı')
      }
      return true
    }),
]

const updatePollValidation = [
  body('question')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Soru en az 10, en fazla 500 karakter olmalı')
    .escape(),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Geçerli bir bitiş tarihi girin'),
]

const voteValidation = [
  body('optionId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir seçenek ID girin'),
]

module.exports = { createPollValidation, updatePollValidation, voteValidation }
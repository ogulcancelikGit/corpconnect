const { body } = require('express-validator')

const sendMessageValidation = [
  body('content')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Mesaj en fazla 5000 karakter olmalı'),
  body('fileIds')
    .optional()
    .isArray()
    .withMessage('fileIds bir dizi olmalı'),
  body('fileIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Geçerli dosya ID girin'),
]

const updateMessageValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Mesaj en az 1, en fazla 5000 karakter olmalı'),
]

module.exports = { sendMessageValidation, updateMessageValidation }
const { body } = require('express-validator')

const createConversationValidation = [
  body('type')
    .isIn(['DIRECT', 'GROUP'])
    .withMessage('Geçerli bir konuşma tipi girin (DIRECT veya GROUP)'),
  body('memberIds')
    .isArray({ min: 1 })
    .withMessage('En az bir üye seçilmeli'),
  body('memberIds.*')
    .isInt({ min: 1 })
    .withMessage('Geçerli kullanıcı ID girin'),
  body('name')
    .if(body('type').equals('GROUP'))
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Grup adı en az 2, en fazla 100 karakter olmalı')
    .escape(),
]

const updateConversationValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Grup adı en az 2, en fazla 100 karakter olmalı')
    .escape(),
]

module.exports = {
  createConversationValidation,
  updateConversationValidation,
}
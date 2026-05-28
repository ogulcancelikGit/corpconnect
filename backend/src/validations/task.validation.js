const { body } = require('express-validator')

const createTaskValidation = [
  body('title').trim().isLength({ min: 2, max: 255 }).withMessage('Başlık 2-255 karakter olmalı'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Açıklama en fazla 2000 karakter'),
  body('priority').optional().isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']).withMessage('Geçersiz öncelik'),
  body('dueDate').optional().isISO8601().withMessage('Geçerli bir tarih girin'),
  body('assignedTo').optional().isInt({ min: 1 }).withMessage('Geçersiz kullanıcı'),
]

const updateTaskValidation = [
  body('title').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Başlık 2-255 karakter olmalı'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('priority').optional().isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']).withMessage('Geçersiz öncelik'),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).withMessage('Geçersiz durum'),
  body('dueDate').optional().isISO8601().withMessage('Geçerli bir tarih girin'),
  body('assignedTo').optional().isInt({ min: 1 }).withMessage('Geçersiz kullanıcı'),
]

module.exports = { createTaskValidation, updateTaskValidation }

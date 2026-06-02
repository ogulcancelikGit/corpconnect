const { body } = require('express-validator')

const createTaskValidation = [
  body('title').trim().isLength({ min: 2, max: 255 }).withMessage('Başlık 2-255 karakter olmalı'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Açıklama en fazla 2000 karakter'),
  body('priority').optional().isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']).withMessage('Geçersiz öncelik'),
  body('dueDate').optional().isISO8601().withMessage('Geçerli bir tarih girin'),
  body('assignedTo').optional().isInt({ min: 1 }).withMessage('Geçersiz kullanıcı'),
  body('labelIds').optional().isArray().withMessage('Etiketler dizi olmalı'),
  body('labelIds.*').optional().isInt({ min: 1 }).withMessage('Geçersiz etiket'),
]

const updateTaskValidation = [
  body('title').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Başlık 2-255 karakter olmalı'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('priority').optional().isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']).withMessage('Geçersiz öncelik'),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).withMessage('Geçersiz durum'),
  body('dueDate').optional().isISO8601().withMessage('Geçerli bir tarih girin'),
  body('assignedTo').optional({ nullable: true }).custom((v) => v === null || Number.isInteger(Number(v))).withMessage('Geçersiz kullanıcı'),
  body('labelIds').optional().isArray().withMessage('Etiketler dizi olmalı'),
  body('labelIds.*').optional().isInt({ min: 1 }).withMessage('Geçersiz etiket'),
]

const commentValidation = [
  body('body').trim().isLength({ min: 1, max: 2000 }).withMessage('Yorum 1-2000 karakter olmalı'),
]

const checklistItemValidation = [
  body('text').trim().isLength({ min: 1, max: 500 }).withMessage('Madde 1-500 karakter olmalı'),
]

module.exports = { createTaskValidation, updateTaskValidation, commentValidation, checklistItemValidation }

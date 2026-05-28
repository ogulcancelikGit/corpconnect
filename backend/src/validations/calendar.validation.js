const { body } = require('express-validator')

const createEventValidation = [
  body('title').trim().isLength({ min: 2, max: 255 }).withMessage('Başlık 2-255 karakter olmalı'),
  body('type').optional().isIn(['MEETING', 'DEADLINE', 'HOLIDAY', 'REMINDER', 'OTHER']).withMessage('Geçersiz etkinlik türü'),
  body('startDate').isISO8601().withMessage('Geçerli başlangıç tarihi girin'),
  body('endDate').isISO8601().withMessage('Geçerli bitiş tarihi girin')
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.startDate)) throw new Error('Bitiş tarihi başlangıçtan önce olamaz')
      return true
    }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('location').optional().trim().isLength({ max: 255 }),
  body('allDay').optional().isBoolean(),
  body('isPublic').optional().isBoolean(),
  body('attendees').optional().isArray(),
]

const updateEventValidation = [
  body('title').optional().trim().isLength({ min: 2, max: 255 }),
  body('type').optional().isIn(['MEETING', 'DEADLINE', 'HOLIDAY', 'REMINDER', 'OTHER']),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('location').optional().trim().isLength({ max: 255 }),
]

module.exports = { createEventValidation, updateEventValidation }

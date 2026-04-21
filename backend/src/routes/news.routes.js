const express = require('express')
const router = express.Router()
const {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  togglePin,
} = require('../controllers/news.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { validate } = require('../middleware/validate.middleware')
const { createNewsValidation, updateNewsValidation } = require('../validations/news.validation')

router.get('/', authenticate, getNews)
router.get('/:id', authenticate, getNewsById)
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), createNewsValidation, validate, createNews)
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateNewsValidation, validate, updateNews)
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), deleteNews)
router.patch('/:id/pin', authenticate, authorize('ADMIN', 'MANAGER'), togglePin)

module.exports = router
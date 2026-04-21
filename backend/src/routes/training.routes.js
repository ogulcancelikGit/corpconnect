const express = require('express')
const router = express.Router()
const {
  getTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
  getCategories,
} = require('../controllers/training.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { validate } = require('../middleware/validate.middleware')
const {
  createTrainingValidation,
  updateTrainingValidation,
} = require('../validations/training.validation')

router.get('/categories', authenticate, getCategories)
router.get('/', authenticate, getTrainings)
router.get('/:id', authenticate, getTrainingById)
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), createTrainingValidation, validate, createTraining)
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateTrainingValidation, validate, updateTraining)
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), deleteTraining)

module.exports = router
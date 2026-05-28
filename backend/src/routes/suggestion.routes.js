const express = require('express')
const router = express.Router()
const { getMySuggestions, getAllSuggestions, createSuggestion, reviewSuggestion, deleteSuggestion, getSuggestionStats } = require('../controllers/suggestion.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { validate } = require('../middleware/validate.middleware')
const { createSuggestionValidation, reviewSuggestionValidation } = require('../validations/suggestion.validation')

router.get('/my', authenticate, getMySuggestions)
router.get('/stats', authenticate, authorize('ADMIN', 'MANAGER'), getSuggestionStats)
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), getAllSuggestions)
router.post('/', authenticate, createSuggestionValidation, validate, createSuggestion)
router.put('/:id/review', authenticate, authorize('ADMIN', 'MANAGER'), reviewSuggestionValidation, validate, reviewSuggestion)
router.delete('/:id', authenticate, deleteSuggestion)

module.exports = router

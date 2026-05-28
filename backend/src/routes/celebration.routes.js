const express = require('express')
const router = express.Router()
const { getTodayCelebrations, getUpcomingCelebrations } = require('../controllers/celebration.controller')
const { authenticate } = require('../middleware/auth.middleware')

router.get('/today', authenticate, getTodayCelebrations)
router.get('/upcoming', authenticate, getUpcomingCelebrations)

module.exports = router

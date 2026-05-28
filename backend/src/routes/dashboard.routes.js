const express = require('express')
const router = express.Router()
const { getStats, getRecentNews, getActivePolls, getFeed } = require('../controllers/dashboard.controller')
const { authenticate } = require('../middleware/auth.middleware')

router.get('/stats', authenticate, getStats)
router.get('/recent-news', authenticate, getRecentNews)
router.get('/active-polls', authenticate, getActivePolls)
router.get('/feed', authenticate, getFeed)

module.exports = router

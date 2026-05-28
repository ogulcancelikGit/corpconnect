const express = require('express')
const router = express.Router()
const { getPublicFeed } = require('../controllers/activity.controller')
const { authenticate } = require('../middleware/auth.middleware')

router.get('/feed', authenticate, getPublicFeed)

module.exports = router

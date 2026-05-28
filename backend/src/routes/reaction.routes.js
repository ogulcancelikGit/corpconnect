const express = require('express')
const router = express.Router({ mergeParams: true })
const { toggleReaction } = require('../controllers/reaction.controller')
const { authenticate } = require('../middleware/auth.middleware')

router.post('/', authenticate, toggleReaction)

module.exports = router

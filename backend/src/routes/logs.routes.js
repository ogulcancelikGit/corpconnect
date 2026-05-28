const express = require('express')
const router = express.Router()
const { getLogs, getActionTypes } = require('../controllers/logs.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')

router.use(authenticate, authorize('ADMIN'))
router.get('/', getLogs)
router.get('/actions', getActionTypes)

module.exports = router

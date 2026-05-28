const express = require('express')
const router = express.Router()
const { sendBroadcast, getBroadcastHistory } = require('../controllers/broadcast.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { validate } = require('../middleware/validate.middleware')
const { sendBroadcastValidation } = require('../validations/broadcast.validation')

router.use(authenticate, authorize('ADMIN'))
router.post('/', sendBroadcastValidation, validate, sendBroadcast)
router.get('/history', getBroadcastHistory)

module.exports = router

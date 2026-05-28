const express = require('express')
const router = express.Router()
const { getMyLeaves, getAllLeaves, createLeave, reviewLeave, cancelLeave, getLeaveStats } = require('../controllers/leave.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { validate } = require('../middleware/validate.middleware')
const { createLeaveValidation, reviewLeaveValidation } = require('../validations/leave.validation')

router.get('/my', authenticate, getMyLeaves)
router.get('/stats', authenticate, authorize('ADMIN', 'MANAGER'), getLeaveStats)
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), getAllLeaves)
router.post('/', authenticate, createLeaveValidation, validate, createLeave)
router.put('/:id/review', authenticate, authorize('ADMIN', 'MANAGER'), reviewLeaveValidation, validate, reviewLeave)
router.delete('/:id', authenticate, cancelLeave)

module.exports = router

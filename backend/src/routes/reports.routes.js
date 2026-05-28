const express = require('express')
const router = express.Router()
const { leaveReport, leaveReportCsv, userReport } = require('../controllers/reports.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')

router.use(authenticate, authorize('ADMIN'))
router.get('/leaves', leaveReport)
router.get('/leaves/csv', leaveReportCsv)
router.get('/users', userReport)

module.exports = router

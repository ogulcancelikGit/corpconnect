const express = require('express')
const router = express.Router()
const {
  getAdminUsers,
  getAdminStats,
  getSettings,
  updateSettings,
  getLogs,
} = require('../controllers/admin.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')

router.use(authenticate, authorize('ADMIN'))

router.get('/users', getAdminUsers)
router.get('/stats', getAdminStats)
router.get('/settings', getSettings)
router.put('/settings', updateSettings)
router.get('/logs', getLogs)

module.exports = router
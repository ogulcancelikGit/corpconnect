const express = require('express')
const router = express.Router()
const {
  getAdminUsers,
  getAdminStats,
  getSettings,
  updateSettings,
  getLogs,
  updateUserStatus,
  updateUserRole,
  createUser,
} = require('../controllers/admin.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')

router.use(authenticate, authorize('ADMIN'))

router.get('/users', getAdminUsers)
router.post('/users', createUser)
router.get('/stats', getAdminStats)
router.get('/settings', getSettings)
router.put('/settings', updateSettings)
router.get('/logs', getLogs)
router.patch('/users/:id/status', updateUserStatus)
router.patch('/users/:id/role', updateUserRole)

module.exports = router
const express = require('express')
const router = express.Router()
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
} = require('../controllers/notification.controller')
const { authenticate } = require('../middleware/auth.middleware')

router.use(authenticate)
router.get('/', getNotifications)
router.get('/unread-count', getUnreadCount)
router.get('/preferences', getPreferences)
router.put('/preferences', updatePreferences)
router.patch('/read-all', markAllAsRead)
router.patch('/:id/read', markAsRead)
router.delete('/:id', deleteNotification)

module.exports = router
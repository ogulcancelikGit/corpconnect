const express = require('express')
const router = express.Router()
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notification.controller')
const { authenticate } = require('../middleware/auth.middleware')

router.get('/', authenticate, getNotifications)
router.get('/unread-count', authenticate, getUnreadCount)
router.patch('/read-all', authenticate, markAllAsRead)
router.patch('/:id/read', authenticate, markAsRead)
router.delete('/:id', authenticate, deleteNotification)

module.exports = router
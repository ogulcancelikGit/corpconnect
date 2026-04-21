const express = require('express')
const router = express.Router()
const {
  getConversations,
  getConversationById,
  createConversation,
  updateConversation,
  leaveConversation,
  getMembers,
  addMember,
  removeMember,
  updateMemberRole,
} = require('../controllers/conversation.controller')
const {
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  markAsRead,
} = require('../controllers/message.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const {
  createConversationValidation,
  updateConversationValidation,
} = require('../validations/conversation.validation')
const {
  sendMessageValidation,
  updateMessageValidation,
} = require('../validations/message.validation')

router.get('/', authenticate, getConversations)
router.get('/:id', authenticate, getConversationById)
router.post('/', authenticate, createConversationValidation, validate, createConversation)
router.put('/:id', authenticate, updateConversationValidation, validate, updateConversation)
router.delete('/:id', authenticate, leaveConversation)

router.get('/:id/members', authenticate, getMembers)
router.post('/:id/members', authenticate, addMember)
router.delete('/:id/members/:userId', authenticate, removeMember)
router.patch('/:id/members/:userId/role', authenticate, updateMemberRole)

router.get('/:id/messages', authenticate, getMessages)
router.post('/:id/messages', authenticate, sendMessageValidation, validate, sendMessage)
router.put('/:id/messages/:msgId', authenticate, updateMessageValidation, validate, updateMessage)
router.delete('/:id/messages/:msgId', authenticate, deleteMessage)
router.patch('/:id/read', authenticate, markAsRead)

module.exports = router
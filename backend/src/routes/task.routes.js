const express = require('express')
const router = express.Router()
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getAssignableUsers,
  addComment,
  deleteComment,
  getStats,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} = require('../controllers/task.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const {
  createTaskValidation,
  updateTaskValidation,
  commentValidation,
  checklistItemValidation,
} = require('../validations/task.validation')

router.use(authenticate)
router.get('/', getTasks)
router.get('/stats', getStats)
router.get('/users', getAssignableUsers)
router.get('/:id', getTaskById)
router.post('/', createTaskValidation, validate, createTask)
router.put('/:id', updateTaskValidation, validate, updateTask)
router.delete('/:id', deleteTask)

router.post('/:id/comments', commentValidation, validate, addComment)
router.delete('/:id/comments/:commentId', deleteComment)

router.post('/:id/checklist', checklistItemValidation, validate, addChecklistItem)
router.patch('/:id/checklist/:itemId', updateChecklistItem)
router.delete('/:id/checklist/:itemId', deleteChecklistItem)

module.exports = router

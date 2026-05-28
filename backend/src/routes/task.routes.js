const express = require('express')
const router = express.Router()
const { getTasks, createTask, updateTask, deleteTask, getAssignableUsers } = require('../controllers/task.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { createTaskValidation, updateTaskValidation } = require('../validations/task.validation')

router.use(authenticate)
router.get('/', getTasks)
router.get('/users', getAssignableUsers)
router.post('/', createTaskValidation, validate, createTask)
router.put('/:id', updateTaskValidation, validate, updateTask)
router.delete('/:id', deleteTask)

module.exports = router

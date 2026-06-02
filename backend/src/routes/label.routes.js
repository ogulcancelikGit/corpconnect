const express = require('express')
const router = express.Router()
const { getLabels, createLabel, deleteLabel } = require('../controllers/label.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { validate } = require('../middleware/validate.middleware')
const { createLabelValidation } = require('../validations/label.validation')

router.use(authenticate)
router.get('/', getLabels)
router.post('/', authorize('ADMIN', 'MANAGER'), createLabelValidation, validate, createLabel)
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteLabel)

module.exports = router

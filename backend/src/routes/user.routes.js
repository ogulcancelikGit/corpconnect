const express = require('express')
const router = express.Router()
const {
  getMe,
  updateMe,
  uploadAvatar,
  deleteAvatar,
  getUsers,
  searchUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
} = require('../controllers/user.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { validate } = require('../middleware/validate.middleware')
const { updateProfileValidation } = require('../validations/user.validation')
const { avatarUpload } = require('../config/multer')

router.get('/me', authenticate, getMe)
router.put('/me', authenticate, updateProfileValidation, validate, updateMe)
router.post('/me/avatar', authenticate, avatarUpload.single('avatar'), uploadAvatar)
router.delete('/me/avatar', authenticate, deleteAvatar)
router.get('/search', authenticate, searchUsers)
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), getUsers)
router.get('/:id', authenticate, authorize('ADMIN', 'MANAGER'), getUserById)
router.put('/:id', authenticate, authorize('ADMIN'), updateUser)
router.delete('/:id', authenticate, authorize('ADMIN'), deleteUser)
router.patch('/:id/role', authenticate, authorize('ADMIN'), updateUserRole)
router.patch('/:id/status', authenticate, authorize('ADMIN'), updateUserStatus)

module.exports = router
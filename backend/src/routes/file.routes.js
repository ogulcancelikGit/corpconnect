const express = require('express')
const router = express.Router()
const {
  uploadFile,
  getFiles,
  getFileById,
  downloadFile,
  deleteFile,
} = require('../controllers/file.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { upload } = require('../config/multer')

router.post('/upload', authenticate, upload.single('file'), uploadFile)
router.get('/', authenticate, getFiles)
router.get('/:id', authenticate, getFileById)
router.get('/:id/download', authenticate, downloadFile)
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), deleteFile)

module.exports = router
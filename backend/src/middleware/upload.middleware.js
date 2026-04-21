const multer = require('multer')
const path = require('path')
const { error } = require('../utils/response.util')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/'

    if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images/'
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath += 'documents/'
    } else {
      uploadPath += 'documents/'
    }

    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'application/zip',
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Desteklenmeyen dosya tipi'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
  },
})

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
      cb(null, uniqueSuffix + path.extname(file.originalname))
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Sadece görsel dosyaları yüklenebilir'), false)
    }
  },
  limits: { fileSize: 2097152 },
})

module.exports = { upload, avatarUpload }
const express = require('express')
const router = express.Router()
const {
  register,
  login,
  logout,
  refresh,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
} = require('../controllers/auth.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require('../validations/auth.validation')
const rateLimit = require('express-rate-limit')

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Çok fazla deneme, 15 dakika sonra tekrar deneyin' },
  skipSuccessfulRequests: true,
})

router.post('/register', authLimiter, registerValidation, validate, register)
router.post('/login', authLimiter, loginValidation, validate, login)
router.post('/logout', authenticate, logout)
router.post('/refresh', refresh)
router.get('/me', authenticate, me)
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validate, forgotPassword)
router.post('/reset-password', resetPasswordValidation, validate, resetPassword)
router.post('/change-password', authenticate, changePasswordValidation, validate, changePassword)

module.exports = router
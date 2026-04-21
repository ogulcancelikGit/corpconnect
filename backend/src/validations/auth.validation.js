const { body } = require('express-validator')

const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir email adresi girin')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Şifre en az 8 karakter olmalı')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermeli'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad en az 2, en fazla 50 karakter olmalı')
    .escape(),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyad en az 2, en fazla 50 karakter olmalı')
    .escape(),
]

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir email adresi girin')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Şifre boş olamaz'),
]

const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir email adresi girin')
    .normalizeEmail(),
]

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token boş olamaz'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Şifre en az 8 karakter olmalı')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermeli'),
]

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mevcut şifre boş olamaz'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Yeni şifre en az 8 karakter olmalı')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermeli'),
]

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
}
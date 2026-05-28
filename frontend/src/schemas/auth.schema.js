import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'E-posta zorunludur')
    .email('Geçerli bir e-posta girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
})

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, 'Ad en az 2 karakter olmalıdır'),
    lastName: z.string().trim().min(2, 'Soyad en az 2 karakter olmalıdır'),
    email: z
      .string()
      .trim()
      .min(1, 'E-posta zorunludur')
      .email('Geçerli bir e-posta girin'),
    password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    confirmPassword: z.string().min(1, 'Şifre tekrarı zorunludur'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'E-posta zorunludur')
    .email('Geçerli bir e-posta girin'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    confirm: z.string().min(1, 'Şifre tekrarı zorunludur'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirm'],
  })

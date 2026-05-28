import { z } from 'zod'

const optStr = (max, msg) =>
  z.string().trim().max(max, msg).optional().or(z.literal(''))

export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'Ad en az 2 karakter olmalıdır')
    .max(100, 'Ad en fazla 100 karakter olabilir'),
  lastName: z
    .string()
    .trim()
    .min(2, 'Soyad en az 2 karakter olmalıdır')
    .max(100, 'Soyad en fazla 100 karakter olabilir'),
  phone: optStr(20, 'Telefon en fazla 20 karakter olabilir'),
  department: optStr(100, 'Departman en fazla 100 karakter olabilir'),
  position: optStr(100, 'Pozisyon en fazla 100 karakter olabilir'),
  bio: optStr(500, 'Biyografi en fazla 500 karakter olabilir'),
  birthDate: z.string().optional().or(z.literal('')),
  hireDate: z.string().optional().or(z.literal('')),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifre zorunludur'),
    newPassword: z.string().min(8, 'Yeni şifre en az 8 karakter olmalıdır'),
    confirmPassword: z.string().min(1, 'Şifre tekrarı zorunludur'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  })

import { z } from 'zod'

const optStr = (max, msg) =>
  z.string().trim().max(max, msg).optional().or(z.literal(''))

export const broadcastSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Başlık zorunludur')
    .max(100, 'Başlık en fazla 100 karakter olabilir'),
  body: z
    .string()
    .trim()
    .min(1, 'Mesaj zorunludur')
    .max(500, 'Mesaj en fazla 500 karakter olabilir'),
  targetRoles: z
    .array(z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']))
    .min(1, 'En az bir hedef grup seçin'),
  link: optStr(500, 'Bağlantı en fazla 500 karakter olabilir'),
})

export const createUserSchema = z.object({
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
  email: z
    .string()
    .trim()
    .min(1, 'E-posta zorunludur')
    .email('Geçerli bir e-posta girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  department: optStr(100, 'Departman en fazla 100 karakter olabilir'),
  position: optStr(100, 'Pozisyon en fazla 100 karakter olabilir'),
  phone: optStr(20, 'Telefon en fazla 20 karakter olabilir'),
})

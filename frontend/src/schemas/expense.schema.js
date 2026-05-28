import { z } from 'zod'

export const createExpenseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Başlık zorunludur')
    .max(255, 'Başlık en fazla 255 karakter olabilir'),
  amount: z.coerce
    .number({ invalid_type_error: 'Geçerli bir tutar girin' })
    .positive("Tutar 0'dan büyük olmalı"),
  currency: z.enum(['TRY', 'USD', 'EUR']),
  category: z.enum(['TRAVEL', 'FOOD', 'ACCOMMODATION', 'OFFICE', 'OTHER']),
  description: z
    .string()
    .trim()
    .max(2000, 'Açıklama en fazla 2000 karakter olabilir')
    .optional()
    .or(z.literal('')),
  expenseDate: z.string().min(1, 'Harcama tarihi zorunludur'),
})

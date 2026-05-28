import { z } from 'zod'

export const createLeaveSchema = z
  .object({
    type: z.enum(['ANNUAL', 'SICK', 'EXCUSE', 'UNPAID']),
    startDate: z.string().min(1, 'Başlangıç tarihi zorunludur'),
    endDate: z.string().min(1, 'Bitiş tarihi zorunludur'),
    reason: z
      .string()
      .trim()
      .max(500, 'Açıklama en fazla 500 karakter olabilir')
      .optional()
      .or(z.literal('')),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: 'Bitiş tarihi başlangıçtan önce olamaz',
    path: ['endDate'],
  })

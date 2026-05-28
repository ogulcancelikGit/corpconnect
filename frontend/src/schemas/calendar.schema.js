import { z } from 'zod'

export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, 'Başlık en az 2 karakter olmalıdır')
      .max(255, 'Başlık en fazla 255 karakter olabilir'),
    type: z.enum(['MEETING', 'DEADLINE', 'HOLIDAY', 'REMINDER', 'OTHER']),
    startDate: z.string().min(1, 'Başlangıç tarihi zorunludur'),
    endDate: z.string().min(1, 'Bitiş tarihi zorunludur'),
    description: z
      .string()
      .trim()
      .max(2000, 'Açıklama en fazla 2000 karakter olabilir')
      .optional()
      .or(z.literal('')),
    location: z
      .string()
      .trim()
      .max(255, 'Konum en fazla 255 karakter olabilir')
      .optional()
      .or(z.literal('')),
    allDay: z.boolean(),
    isPublic: z.boolean(),
    attendees: z.array(z.number()),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: 'Bitiş tarihi başlangıçtan sonra olmalıdır',
    path: ['endDate'],
  })

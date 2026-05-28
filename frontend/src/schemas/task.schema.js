import { z } from 'zod'

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Başlık en az 2 karakter olmalıdır')
    .max(255, 'Başlık en fazla 255 karakter olabilir'),
  description: z
    .string()
    .trim()
    .max(2000, 'Açıklama en fazla 2000 karakter olabilir')
    .optional()
    .or(z.literal('')),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  dueDate: z.string().optional().or(z.literal('')),
  assignedTo: z.string().optional().or(z.literal('')),
})

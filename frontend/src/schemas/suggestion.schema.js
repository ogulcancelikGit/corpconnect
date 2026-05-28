import { z } from 'zod'

export const createSuggestionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Başlık zorunludur')
    .max(255, 'Başlık en fazla 255 karakter olabilir'),
  content: z
    .string()
    .trim()
    .min(1, 'Açıklama zorunludur')
    .max(5000, 'Açıklama en fazla 5000 karakter olabilir'),
  category: z.enum(['PROCESS', 'TECHNOLOGY', 'CULTURE', 'SAFETY', 'OTHER']),
  isAnonymous: z.boolean(),
})

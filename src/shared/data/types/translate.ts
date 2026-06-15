import { z } from 'zod'

export const SUPPORTED_LANGUAGES = {
  auto: 'Auto Detect',
  en: 'English',
  zh: 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  ja: 'Japanese',
  ko: 'Korean',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  pt: 'Portuguese',
  ru: 'Russian',
  ar: 'Arabic',
  it: 'Italian',
  nl: 'Dutch',
  pl: 'Polish',
  vi: 'Vietnamese',
  th: 'Thai',
  tr: 'Turkish',
  id: 'Indonesian'
} as const

export type LangCode = keyof typeof SUPPORTED_LANGUAGES

export const TranslateHistorySchema = z.object({
  id: z.string().min(1),
  sourceText: z.string(),
  targetText: z.string(),
  sourceLang: z.string().default('auto'),
  targetLang: z.string().default('en'),
  providerId: z.string().optional(),
  modelId: z.string().optional(),
  createdAt: z.number()
})

export type TranslateHistory = z.infer<typeof TranslateHistorySchema>

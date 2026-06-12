import { z } from 'zod'
import { ENDPOINT_TYPE } from './provider'

export const MODEL_CAPABILITY = {
  VISION: 'vision',
  REASONING: 'reasoning',
  FUNCTION_CALLING: 'function_calling',
  CODE: 'code',
  EMBEDDING: 'embedding',
  IMAGE_GENERATION: 'image_generation',
  WEB_SEARCH: 'web_search'
} as const

export type ModelCapability = (typeof MODEL_CAPABILITY)[keyof typeof MODEL_CAPABILITY]

export const ModelSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  name: z.string().min(1),
  /** Display name shown in UI */
  displayName: z.string().optional(),
  endpointType: z.nativeEnum(ENDPOINT_TYPE).optional(),
  capabilities: z.array(z.nativeEnum(MODEL_CAPABILITY)).default([]),
  contextWindow: z.number().positive().optional(),
  maxOutputTokens: z.number().positive().optional(),
  isEnabled: z.boolean().default(true),
  /** User-added custom model */
  isCustom: z.boolean().default(false),
  pricing: z
    .object({
      inputPerMillion: z.number().nonnegative().nullable().optional(),
      outputPerMillion: z.number().nonnegative().nullable().optional(),
      currency: z.string().default('USD')
    })
    .optional()
})

export type Model = z.infer<typeof ModelSchema>

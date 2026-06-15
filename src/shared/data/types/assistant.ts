import { z } from 'zod'

export const AssistantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  emoji: z.string().optional(),
  description: z.string().optional(),
  /** System prompt */
  prompt: z.string().default(''),
  /** Preferred model id */
  modelId: z.string().optional(),
  providerId: z.string().optional(),
  /** Max tokens for responses */
  maxTokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(2).default(1),
  isBuiltin: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.number(),
  updatedAt: z.number()
})

export type Assistant = z.infer<typeof AssistantSchema>

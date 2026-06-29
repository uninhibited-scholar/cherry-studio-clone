import { z } from 'zod'

export const AssistantGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sortOrder: z.number().default(0),
  createdAt: z.number()
})

export type AssistantGroup = z.infer<typeof AssistantGroupSchema>

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
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  isBuiltin: z.boolean().default(false),
  sortOrder: z.number().default(0),
  groupId: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number()
})

export type Assistant = z.infer<typeof AssistantSchema>

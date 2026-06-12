import { z } from 'zod'

export const MESSAGE_ROLE = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system'
} as const

export type MessageRole = (typeof MESSAGE_ROLE)[keyof typeof MESSAGE_ROLE]

export const MessageSchema = z.object({
  id: z.string().min(1),
  topicId: z.string().min(1),
  role: z.nativeEnum(MESSAGE_ROLE),
  content: z.string(),
  modelId: z.string().optional(),
  providerId: z.string().optional(),
  /** Raw token usage from provider */
  usage: z
    .object({
      inputTokens: z.number().nonnegative().optional(),
      outputTokens: z.number().nonnegative().optional()
    })
    .optional(),
  /** Attached file ids */
  fileIds: z.array(z.string()).default([]),
  createdAt: z.number(),
  updatedAt: z.number()
})

export type Message = z.infer<typeof MessageSchema>

export const TopicSchema = z.object({
  id: z.string().min(1),
  assistantId: z.string().min(1),
  title: z.string().default('New Topic'),
  createdAt: z.number(),
  updatedAt: z.number()
})

export type Topic = z.infer<typeof TopicSchema>

import { z } from 'zod'

/** Supported AI provider endpoint types */
export const ENDPOINT_TYPE = {
  OPENAI_CHAT_COMPLETIONS: 'openai_chat_completions',
  OPENAI_RESPONSES: 'openai_responses',
  ANTHROPIC_MESSAGES: 'anthropic_messages',
  GOOGLE_GEMINI: 'google_gemini',
  AZURE_OPENAI: 'azure_openai',
  CUSTOM: 'custom'
} as const

export type EndpointType = (typeof ENDPOINT_TYPE)[keyof typeof ENDPOINT_TYPE]

export const ApiKeySchema = z.object({
  id: z.string().min(1),
  key: z.string().trim().min(1),
  label: z.string().optional(),
  isEnabled: z.boolean().default(true)
})

export const ProviderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  apiKey: z.string().optional(),
  apiKeys: z.array(ApiKeySchema).optional(),
  apiHost: z.string().url().optional(),
  defaultEndpointType: z.nativeEnum(ENDPOINT_TYPE).default(ENDPOINT_TYPE.OPENAI_CHAT_COMPLETIONS),
  isEnabled: z.boolean().default(true),
  isBuiltin: z.boolean().default(false),
  /** Provider website / docs urls */
  website: z
    .object({
      official: z.string().url().optional(),
      docs: z.string().url().optional(),
      apiKey: z.string().url().optional()
    })
    .optional()
})

export type Provider = z.infer<typeof ProviderSchema>
export type ApiKey = z.infer<typeof ApiKeySchema>

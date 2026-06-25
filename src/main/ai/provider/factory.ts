import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAzure } from '@ai-sdk/azure'
import type { LanguageModel } from 'ai'
import type { Provider } from '@shared/data/types/provider'
import type { Model } from '@shared/data/types/model'
import { ENDPOINT_TYPE } from '@shared/data/types/provider'
import { loggerService } from '@logger'

const logger = loggerService.withContext('ProviderFactory')

/**
 * Build an @ai-sdk LanguageModel from user-stored Provider + Model config.
 *
 * Supported endpoint types:
 *   openai_chat_completions  → @ai-sdk/openai (also covers openai-compatible)
 *   openai_responses         → @ai-sdk/openai responses API
 *   anthropic_messages       → @ai-sdk/anthropic
 *   google_gemini            → @ai-sdk/google
 *   custom                   → @ai-sdk/openai with custom base URL
 */
export function buildLanguageModel(provider: Provider, model: Model): LanguageModel {
  const endpointType = model.endpointType ?? provider.defaultEndpointType
  const apiKey = provider.apiKey ?? ''

  logger.debug(`Building model: ${model.id} via ${endpointType}`)

  switch (endpointType) {
    case ENDPOINT_TYPE.ANTHROPIC_MESSAGES: {
      const client = createAnthropic({ apiKey })
      return client(model.name)
    }

    case ENDPOINT_TYPE.GOOGLE_GEMINI: {
      const client = createGoogleGenerativeAI({ apiKey })
      return client(model.name)
    }

    case ENDPOINT_TYPE.OPENAI_RESPONSES: {
      const client = createOpenAI({
        apiKey,
        baseURL: provider.apiHost,
        compatibility: 'strict'
      })
      return client.responses(model.name)
    }

    case ENDPOINT_TYPE.AZURE_OPENAI: {
      const client = createAzure({
        apiKey,
        resourceName: provider.resourceName ?? '',
        apiVersion: provider.apiVersion ?? '2024-10-21'
      })
      return client(model.name)
    }

    case ENDPOINT_TYPE.GROQ: {
      const client = createOpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
        compatibility: 'compatible'
      })
      return client(model.name)
    }

    // openai_chat_completions, custom — all through openai-compat
    default: {
      const client = createOpenAI({
        apiKey,
        baseURL: provider.apiHost,
        compatibility: provider.apiHost ? 'compatible' : 'strict'
      })
      return client(model.name)
    }
  }
}

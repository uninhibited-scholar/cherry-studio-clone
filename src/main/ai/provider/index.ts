/**
 * AI Provider factory.
 *
 * Resolves an @ai-sdk compatible provider instance from a stored Provider config.
 * All provider SDK imports live here; consumers receive a typed LanguageModel.
 *
 * Supported endpoint types (to implement):
 *   openai_chat_completions  → @ai-sdk/openai
 *   openai_responses         → @ai-sdk/openai (responses API)
 *   anthropic_messages       → @ai-sdk/anthropic
 *   google_gemini            → @ai-sdk/google
 *   azure_openai             → @ai-sdk/azure
 *   custom                   → @ai-sdk/openai-compatible
 */

import type { Provider } from '@shared/data/types/provider'
import type { Model } from '@shared/data/types/model'
import { ENDPOINT_TYPE } from '@shared/data/types/provider'
import { loggerService } from '@logger'

const logger = loggerService.withContext('ProviderFactory')

export type LanguageModelHandle = {
  providerId: string
  modelId: string
  /** Call streamText / generateText from ai-sdk with this */
  sdkProviderId: string
}

export function resolveProviderHandle(provider: Provider, model: Model): LanguageModelHandle {
  const endpointType = model.endpointType ?? provider.defaultEndpointType

  logger.debug(`Resolving provider handle: ${provider.id} / ${model.id} via ${endpointType}`)

  return {
    providerId: provider.id,
    modelId: model.id,
    sdkProviderId: mapEndpointToSdkId(endpointType)
  }
}

function mapEndpointToSdkId(endpointType: string): string {
  switch (endpointType) {
    case ENDPOINT_TYPE.OPENAI_CHAT_COMPLETIONS:
    case ENDPOINT_TYPE.OPENAI_RESPONSES:
      return 'openai'
    case ENDPOINT_TYPE.ANTHROPIC_MESSAGES:
      return 'anthropic'
    case ENDPOINT_TYPE.GOOGLE_GEMINI:
      return 'google'
    case ENDPOINT_TYPE.AZURE_OPENAI:
      return 'azure'
    default:
      return 'openai-compatible'
  }
}

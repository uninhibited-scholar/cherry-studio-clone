import { streamText } from 'ai'
import { buildLanguageModel } from './provider/factory'
import { providerService } from '../data/services/ProviderService'
import { loggerService } from '@logger'

const logger = loggerService.withContext('AiService')

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type StreamChunk =
  | { type: 'text'; text: string }
  | { type: 'done'; usage?: { inputTokens: number; outputTokens: number } }
  | { type: 'error'; error: string }

export type StreamParams = {
  requestId: string
  providerId: string
  modelId: string
  messages: ChatMessage[]
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  onChunk: (chunk: StreamChunk) => void
}

export class AiService {
  private activeStreams = new Map<string, AbortController>()

  async streamChat(params: StreamParams): Promise<void> {
    const { requestId, providerId, modelId, messages, systemPrompt, temperature, maxTokens, onChunk } = params

    // Resolve provider + model from DB
    const providers = await providerService.listProviders()
    const provider = providers.find((p) => p.id === providerId)
    if (!provider) {
      onChunk({ type: 'error', error: `Provider not found: ${providerId}` })
      return
    }

    const models = await providerService.listModels(providerId)
    const model = models.find((m) => m.id === modelId)
    if (!model) {
      onChunk({ type: 'error', error: `Model not found: ${modelId}` })
      return
    }

    const abortController = new AbortController()
    this.activeStreams.set(requestId, abortController)

    logger.info(`Stream start [${requestId}]: ${provider.name}/${model.name}`)

    try {
      const languageModel = buildLanguageModel(provider, model)

      const result = streamText({
        model: languageModel,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: temperature ?? 1,
        maxTokens,
        abortSignal: abortController.signal
      })

      for await (const chunk of result.textStream) {
        if (abortController.signal.aborted) break
        onChunk({ type: 'text', text: chunk })
      }

      const usage = await result.usage
      onChunk({
        type: 'done',
        usage: usage
          ? { inputTokens: usage.promptTokens, outputTokens: usage.completionTokens }
          : undefined
      })
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        logger.info(`Stream aborted [${requestId}]`)
        onChunk({ type: 'done' })
        return
      }
      logger.error(`Stream error [${requestId}]`, err)
      onChunk({ type: 'error', error: String(err) })
    } finally {
      this.activeStreams.delete(requestId)
    }
  }

  abort(requestId: string): void {
    const ctrl = this.activeStreams.get(requestId)
    if (ctrl) {
      ctrl.abort()
      this.activeStreams.delete(requestId)
      logger.info(`Aborted stream: ${requestId}`)
    }
  }
}

export const aiService = new AiService()

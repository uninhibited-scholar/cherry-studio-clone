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

/**
 * AiService — core AI request dispatcher.
 *
 * Responsibilities (to implement):
 *   1. Route requests to the correct provider via ProviderFactory
 *   2. Stream chunks back to renderer via IPC
 *   3. Handle abort signals
 *   4. Tool calling / function calling
 *   5. Inject knowledge-base context (RAG)
 *   6. Retry / fallback on provider error
 */
export class AiService {
  private activeStreams = new Map<string, AbortController>()

  async streamChat(params: {
    requestId: string
    providerId: string
    modelId: string
    messages: ChatMessage[]
    systemPrompt?: string
    onChunk: (chunk: StreamChunk) => void
  }): Promise<void> {
    const { requestId, messages, onChunk } = params
    const abortController = new AbortController()
    this.activeStreams.set(requestId, abortController)

    logger.info(`Starting stream: ${requestId}`)

    try {
      // TODO: resolve provider + model, call ai-sdk streamText
      // Placeholder echo for skeleton stage
      onChunk({ type: 'text', text: `Echo: ${messages.at(-1)?.content ?? ''}` })
      onChunk({ type: 'done', usage: { inputTokens: 0, outputTokens: 0 } })
    } catch (err) {
      logger.error('Stream error', err)
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

import { streamText, jsonSchema, tool } from 'ai'
import { buildLanguageModel } from './provider/factory'
import { providerService } from '../data/services/ProviderService'
import { mcpService } from '../services/McpService'
import { loggerService } from '@logger'
import { withRetry } from './RetryPolicy'
import { truncateContext } from './ContextManager'

const logger = loggerService.withContext('AiService')

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type StreamChunk =
  | { type: 'text'; text: string }
  | { type: 'done'; usage?: { inputTokens: number; outputTokens: number } }
  | { type: 'error'; error: string }

export type McpToolDefs = Record<string, { description: string; inputSchema: Record<string, unknown> }>

export type StreamParams = {
  requestId: string
  providerId: string
  modelId: string
  messages: ChatMessage[]
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  mcpTools?: McpToolDefs
  onChunk: (chunk: StreamChunk) => void
}

export class AiService {
  private activeStreams = new Map<string, AbortController>()

  async streamChat(params: StreamParams): Promise<void> {
    const { requestId, providerId, modelId, messages, systemPrompt, temperature, maxTokens, mcpTools, onChunk } = params

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
    const timeoutId = setTimeout(() => abortController.abort(), 120_000)
    this.activeStreams.set(requestId, abortController)

    logger.info(`Stream start [${requestId}]: ${provider.name}/${model.name}`)

    try {
      const languageModel = buildLanguageModel(provider, model)

      // Truncate context to avoid exceeding model context windows
      const contextLimit = model.contextWindow ?? 100_000
      const truncated = truncateContext(messages, contextLimit, systemPrompt)

      // Build tool definitions with MCP executors when tools are provided
      const tools = mcpTools && Object.keys(mcpTools).length > 0
        ? Object.entries(mcpTools).reduce<Record<string, ReturnType<typeof tool>>>((acc, [toolKey, def]) => {
            const [serverId, toolName] = toolKey.split('__')
            acc[toolKey] = tool({
              description: def.description,
              parameters: jsonSchema(def.inputSchema as Parameters<typeof jsonSchema>[0]),
              execute: async (args) => {
                logger.info(`Tool call: ${toolKey}`, args)
                try {
                  return await mcpService.callTool(serverId, toolName, args as Record<string, unknown>)
                } catch (err) {
                  return { error: String(err) }
                }
              }
            })
            return acc
          }, {})
        : undefined

      const result = await withRetry(() => Promise.resolve(streamText({
        model: languageModel,
        system: systemPrompt,
        messages: truncated.map((m) => ({ role: m.role, content: m.content })),
        temperature: temperature ?? 1,
        maxTokens,
        tools,
        maxSteps: tools ? 5 : 1,
        abortSignal: abortController.signal
      })))

      let usage: Awaited<typeof result.usage> | undefined
      for await (const part of result.fullStream) {
        if (abortController.signal.aborted) break
        if (part.type === 'text-delta') {
          onChunk({ type: 'text', text: part.textDelta })
        } else if (part.type === 'finish') {
          usage = part.usage
        } else if (part.type === 'error') {
          throw part.error
        }
      }

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
      clearTimeout(timeoutId)
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

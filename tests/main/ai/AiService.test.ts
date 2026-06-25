import { describe, test, expect, beforeEach, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp' } }))
vi.mock('@logger', () => ({
  loggerService: { withContext: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }) }
}))

// Mock the AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn(),
  tool: vi.fn((def) => def),
  jsonSchema: vi.fn((s) => s)
}))

// Mock the provider factory
vi.mock('../../../src/main/ai/provider/factory', () => ({
  buildLanguageModel: vi.fn(() => ({}))
}))

// Mock McpService
vi.mock('../../../src/main/services/McpService', () => ({
  mcpService: { callTool: vi.fn() }
}))

// Mock ProviderService singleton
vi.mock('../../../src/main/data/services/ProviderService', () => ({
  providerService: {
    listProviders: vi.fn(),
    listModels: vi.fn()
  }
}))

import { AiService } from '../../../src/main/ai/AiService'
import { streamText } from 'ai'
import { providerService } from '../../../src/main/data/services/ProviderService'

const mockListProviders = vi.mocked(providerService.listProviders)
const mockListModels = vi.mocked(providerService.listModels)
const mockStreamText = vi.mocked(streamText)

describe('AiService', () => {
  let service: AiService

  const baseProvider = { id: 'p1', name: 'TestProvider', apiKey: 'key', isEnabled: true, isBuiltin: false, defaultEndpointType: 'openai_chat_completions' as const }
  const baseModel = { id: 'm1', name: 'gpt-4', providerId: 'p1', isEnabled: true, isCustom: false, capabilities: [] }

  beforeEach(() => {
    service = new AiService()
    vi.clearAllMocks()
  })

  test('streamChat() with missing provider calls onChunk with error', async () => {
    mockListProviders.mockResolvedValue([])

    const chunks: unknown[] = []
    await service.streamChat({
      requestId: 'req-1',
      providerId: 'nonexistent',
      modelId: 'm1',
      messages: [{ role: 'user', content: 'Hi' }],
      onChunk: (c) => chunks.push(c)
    })

    expect(chunks).toHaveLength(1)
    expect((chunks[0] as { type: string }).type).toBe('error')
    expect((chunks[0] as { error: string }).error).toContain('nonexistent')
  })

  test('streamChat() with missing model calls onChunk with error', async () => {
    mockListProviders.mockResolvedValue([baseProvider])
    mockListModels.mockResolvedValue([])

    const chunks: unknown[] = []
    await service.streamChat({
      requestId: 'req-2',
      providerId: 'p1',
      modelId: 'nonexistent-model',
      messages: [{ role: 'user', content: 'Hi' }],
      onChunk: (c) => chunks.push(c)
    })

    expect(chunks).toHaveLength(1)
    expect((chunks[0] as { type: string }).type).toBe('error')
    expect((chunks[0] as { error: string }).error).toContain('nonexistent-model')
  })

  test('streamChat() streams text chunks and done', async () => {
    mockListProviders.mockResolvedValue([baseProvider])
    mockListModels.mockResolvedValue([baseModel])

    // streamText is called synchronously and returns an object with fullStream
    async function* fakeStream() {
      yield { type: 'text-delta', textDelta: 'Hello' }
      yield { type: 'text-delta', textDelta: ' world' }
    }
    mockStreamText.mockReturnValue({
      fullStream: fakeStream(),
      usage: Promise.resolve({ promptTokens: 10, completionTokens: 5 })
    } as unknown as ReturnType<typeof streamText>)

    const chunks: unknown[] = []
    await service.streamChat({
      requestId: 'req-3',
      providerId: 'p1',
      modelId: 'm1',
      messages: [{ role: 'user', content: 'Hi' }],
      onChunk: (c) => chunks.push(c)
    })

    const textChunks = chunks.filter((c) => (c as { type: string }).type === 'text')
    expect(textChunks.length).toBeGreaterThanOrEqual(1)
    const done = chunks.find((c) => (c as { type: string }).type === 'done')
    expect(done).toBeTruthy()
  })

  test('abort() causes the stream to be aborted', async () => {
    mockListProviders.mockResolvedValue([baseProvider])
    mockListModels.mockResolvedValue([baseModel])

    let capturedSignal: AbortSignal | undefined
    // Mock streamText to capture signal and yield one chunk then pause
    mockStreamText.mockImplementation(({ abortSignal: sig }: { abortSignal?: AbortSignal }) => {
      capturedSignal = sig
      async function* pausedStream() {
        // Yield nothing — stream hangs until aborted
        await new Promise<void>((resolve) => {
          sig?.addEventListener('abort', () => resolve())
        })
        // After abort, throw AbortError so AiService handles it
        const err = new Error('AbortError')
        err.name = 'AbortError'
        throw err
      }
      return {
        fullStream: pausedStream(),
        usage: Promise.resolve({ promptTokens: 0, completionTokens: 0 })
      } as unknown as ReturnType<typeof streamText>
    })

    const onChunk = vi.fn()
    const streamPromise = service.streamChat({
      requestId: 'req-4',
      providerId: 'p1',
      modelId: 'm1',
      messages: [{ role: 'user', content: 'Hi' }],
      onChunk
    })

    // Give streamChat a tick to register the abort controller and start streaming
    await new Promise((r) => setTimeout(r, 0))
    service.abort('req-4')
    await streamPromise

    expect(capturedSignal?.aborted).toBe(true)
    // Should call onChunk with done (abort path)
    const doneChunk = onChunk.mock.calls.find(([c]) => c.type === 'done')
    expect(doneChunk).toBeTruthy()
  })
})

import { ipcMain } from 'electron'
import { IpcChannel } from '@shared/IpcChannel'
import { loggerService } from '@logger'
import { aiService } from './ai/AiService'
import { assistantService } from './data/services/AssistantService'
import { topicService } from './data/services/TopicService'
import { messageService } from './data/services/MessageService'
import { providerService } from './data/services/ProviderService'
import { noteService } from './data/services/NoteService'
import { translateService } from './data/services/TranslateService'
import { webSearch } from './services/webSearch/WebSearchService'

const logger = loggerService.withContext('IPC')

export function registerIpcHandlers(): void {
  // ── AI Stream ───────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.AI_CHAT, async (event, params) => {
    const { requestId, providerId, modelId, messages, systemPrompt, temperature, maxTokens } = params

    await aiService.streamChat({
      requestId,
      providerId,
      modelId,
      messages,
      systemPrompt,
      temperature,
      maxTokens,
      onChunk: (chunk) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send(IpcChannel.AI_STREAM_CHUNK, { requestId, chunk })
        }
      }
    })
  })

  ipcMain.on(IpcChannel.AI_ABORT, (_event, requestId: string) => {
    aiService.abort(requestId)
  })

  // ── Providers ───────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.PROVIDERS_LIST, async () => {
    return providerService.listProviders()
  })

  ipcMain.handle(IpcChannel.PROVIDERS_UPSERT, async (_event, data) => {
    return providerService.upsertProvider(data)
  })

  ipcMain.handle(IpcChannel.PROVIDERS_DELETE, async (_event, id: string) => {
    return providerService.deleteProvider(id)
  })

  ipcMain.handle(IpcChannel.MODELS_LIST, async (_event, providerId?: string) => {
    return providerService.listModels(providerId)
  })

  ipcMain.handle(IpcChannel.MODELS_UPSERT, async (_event, data) => {
    return providerService.upsertModel(data)
  })

  ipcMain.handle(IpcChannel.MODELS_DELETE, async (_event, id: string) => {
    return providerService.deleteModel(id)
  })

  // Legacy string channel (used in ProvidersSettings quick-add path)
  ipcMain.handle('models:upsert', async (_event, data) => {
    return providerService.upsertModel(data)
  })

  // ── Assistants ──────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.ASSISTANTS_LIST, async () => {
    return assistantService.list()
  })

  ipcMain.handle(IpcChannel.ASSISTANTS_UPSERT, async (_event, data) => {
    return assistantService.upsert(data)
  })

  ipcMain.handle(IpcChannel.ASSISTANTS_DELETE, async (_event, id: string) => {
    return assistantService.delete(id)
  })

  // ── Topics ──────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.TOPICS_LIST, async (_event, assistantId: string) => {
    return topicService.listByAssistant(assistantId)
  })

  ipcMain.handle(IpcChannel.TOPICS_CREATE, async (_event, { assistantId, title }) => {
    return topicService.create(assistantId, title)
  })

  ipcMain.handle(IpcChannel.TOPICS_UPDATE, async (_event, { id, title }) => {
    return topicService.updateTitle(id, title)
  })

  ipcMain.handle(IpcChannel.TOPICS_DELETE, async (_event, id: string) => {
    return topicService.delete(id)
  })

  // ── Messages ────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.MESSAGES_LIST, async (_event, topicId: string) => {
    return messageService.listByTopic(topicId)
  })

  ipcMain.handle(IpcChannel.MESSAGES_CREATE, async (_event, data) => {
    return messageService.create(data)
  })

  ipcMain.handle(IpcChannel.MESSAGES_DELETE, async (_event, id: string) => {
    return messageService.delete(id)
  })

  // ── Notes ───────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.NOTES_LIST, async () => noteService.list())

  ipcMain.handle(IpcChannel.NOTES_CREATE, async (_event, data) => noteService.create(data))

  ipcMain.handle(IpcChannel.NOTES_UPDATE, async (_event, { id, ...data }) => {
    await noteService.update(id, data)
  })

  ipcMain.handle(IpcChannel.NOTES_DELETE, async (_event, id: string) => noteService.delete(id))

  // ── Web Search ──────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.WEB_SEARCH, async (_event, { query, maxResults }) => {
    return webSearch(query, maxResults ?? 5)
  })

  // ── Translate ────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.TRANSLATE_RUN, async (event, params) => {
    const { requestId, sourceText, sourceLang, targetLang, providerId, modelId } = params
    let full = ''
    await translateService.translate({
      sourceText,
      sourceLang,
      targetLang,
      providerId,
      modelId,
      onChunk: (text) => {
        full += text
        if (!event.sender.isDestroyed()) {
          event.sender.send(IpcChannel.TRANSLATE_CHUNK, { requestId, text })
        }
      }
    })
    // Persist to history
    await translateService.saveHistory({ sourceText, targetText: full, sourceLang, targetLang, providerId, modelId })
    return full
  })

  ipcMain.handle(IpcChannel.TRANSLATE_HISTORY_LIST, async () => translateService.listHistory())

  ipcMain.handle(IpcChannel.TRANSLATE_HISTORY_CLEAR, async () => translateService.clearHistory())

  // ── App ─────────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.APP_VERSION, () => {
    return process.env.npm_package_version ?? '0.1.0'
  })

  logger.info('All IPC handlers registered')
}

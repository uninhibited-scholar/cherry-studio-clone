import { ipcMain, BrowserWindow, shell } from 'electron'
import { IpcChannel } from '@shared/IpcChannel'
import { loggerService } from '@logger'
import { aiService } from './ai/AiService'
import { assistantService } from './data/services/AssistantService'
import { topicService } from './data/services/TopicService'
import { messageService } from './data/services/MessageService'
import { providerService } from './data/services/ProviderService'
import { noteService } from './data/services/NoteService'
import { translateService } from './data/services/TranslateService'
import { webSearch, setWebSearchConfig, getWebSearchConfig, type WebSearchConfig } from './services/webSearch/WebSearchService'
import { knowledgeService } from './data/services/KnowledgeService'
import { paintingService } from './data/services/PaintingService'
import { mcpService } from './services/McpService'
import { topicNamingService } from './services/TopicNamingService'
import { historyService } from './data/services/HistoryService'
import { libraryService } from './data/services/LibraryService'

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

  ipcMain.handle(IpcChannel.TOPICS_NAME, async (event, { topicId, firstUserMessage, firstAssistantReply, providerId, modelId }) => {
    return topicNamingService.name(topicId, firstUserMessage, firstAssistantReply, providerId, modelId, event.sender)
  })

  // ── History ─────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.HISTORY_LIST_ALL, async () => historyService.listAll())

  ipcMain.handle(IpcChannel.HISTORY_SEARCH, async (_event, query: string) => historyService.search(query))

  // ── Library ─────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.LIBRARY_LIST, async () => libraryService.list())

  ipcMain.handle(IpcChannel.LIBRARY_CREATE, async (_event, data) => libraryService.create(data))

  ipcMain.handle(IpcChannel.LIBRARY_DELETE, async (_event, id: string) => libraryService.delete(id))

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

  // ── Knowledge ───────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.KNOWLEDGE_LIST, async (_event, knowledgeBaseId?: string) => {
    if (knowledgeBaseId) return knowledgeService.listDocuments(knowledgeBaseId)
    return knowledgeService.listBases()
  })

  ipcMain.handle(IpcChannel.KNOWLEDGE_CREATE, async (_event, data) => {
    if (data.knowledgeBaseId) return knowledgeService.addDocument(data)
    return knowledgeService.createBase(data)
  })

  ipcMain.handle(IpcChannel.KNOWLEDGE_DELETE, async (_event, data: { id: string; type: 'base' | 'document' }) => {
    if (data.type === 'document') return knowledgeService.deleteDocument(data.id)
    return knowledgeService.deleteBase(data.id)
  })

  ipcMain.handle(IpcChannel.KNOWLEDGE_SEARCH, async (_event, { knowledgeBaseId, query, limit }) => {
    return knowledgeService.search(knowledgeBaseId, query, limit)
  })

  // ── Paintings ───────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.PAINTINGS_LIST, async () => paintingService.list())

  ipcMain.handle(IpcChannel.PAINTINGS_GENERATE, async (_event, params) => {
    return paintingService.generate(params)
  })

  ipcMain.handle(IpcChannel.PAINTINGS_DELETE, async (_event, id: string) => {
    return paintingService.delete(id)
  })

  ipcMain.handle(IpcChannel.PAINTINGS_SAVE, async (_event, { imageData, prompt }: { imageData: string; prompt: string }) => {
    const { dialog } = await import('electron')
    const { writeFile } = await import('fs/promises')
    const safeName = prompt.slice(0, 40).replace(/[/\\?%*:|"<>]/g, '-') || 'painting'
    const result = await dialog.showSaveDialog({
      defaultPath: `${safeName}.png`,
      filters: [{ name: 'PNG Image', extensions: ['png'] }]
    })
    if (result.canceled || !result.filePath) return null
    const buffer = Buffer.from(imageData, 'base64')
    await writeFile(result.filePath, buffer)
    shell.showItemInFolder(result.filePath)
    return result.filePath
  })

  // ── MCP ─────────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.MCP_LIST, async () => mcpService.list())

  ipcMain.handle(IpcChannel.MCP_UPSERT, async (_event, data) => mcpService.upsert(data))

  ipcMain.handle(IpcChannel.MCP_DELETE, async (_event, id: string) => mcpService.delete(id))

  ipcMain.handle(IpcChannel.MCP_CONNECT, async (_event, serverId: string) => mcpService.connect(serverId))

  ipcMain.handle(IpcChannel.MCP_DISCONNECT, async (_event, serverId: string) => mcpService.disconnect(serverId))

  ipcMain.handle(IpcChannel.MCP_TOOLS, async (_event, serverId: string) => mcpService.getTools(serverId))

  ipcMain.handle(IpcChannel.MCP_CALL_TOOL, async (_event, { serverId, toolName, args }) => {
    return mcpService.callTool(serverId, toolName, args)
  })

  // ── Mini Apps ───────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.MINI_APPS_OPEN, (_event, { url, title }: { url: string; title: string }) => {
    const win = new BrowserWindow({
      width: 1100,
      height: 760,
      title,
      webPreferences: { contextIsolation: true, nodeIntegration: false }
    })
    win.loadURL(url)
    win.webContents.setWindowOpenHandler(({ url: u }) => {
      shell.openExternal(u)
      return { action: 'deny' }
    })
  })

  // ── Web Search Config ────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.WEB_SEARCH_CONFIG_GET, () => getWebSearchConfig())

  ipcMain.handle(IpcChannel.WEB_SEARCH_CONFIG_SET, (_event, config: WebSearchConfig) => {
    setWebSearchConfig(config)
  })

  // ── Export ───────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.EXPORT_TOPIC, async (_event, topicId: string) => {
    const { messageService: ms } = await import('./data/services/MessageService')
    const { topicService: ts } = await import('./data/services/TopicService')
    const [msgs, tp] = await Promise.all([ms.listByTopic(topicId), ts.get(topicId)])
    if (!tp) return null

    const lines: string[] = [
      `# ${tp.title}`,
      `> Exported ${new Date().toLocaleString()}`,
      ''
    ]
    for (const m of msgs) {
      lines.push(`**${m.role === 'user' ? 'You' : 'Assistant'}**`)
      lines.push('')
      lines.push(m.content)
      lines.push('')
      lines.push('---')
      lines.push('')
    }

    const { dialog } = await import('electron')
    const { writeFile } = await import('fs/promises')
    const result = await dialog.showSaveDialog({
      defaultPath: `${tp.title.replace(/[/\\?%*:|"<>]/g, '-')}.md`,
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (result.canceled || !result.filePath) return null
    await writeFile(result.filePath, lines.join('\n'), 'utf8')
    shell.showItemInFolder(result.filePath)
    return result.filePath
  })

  // ── File utilities ────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.PROVIDER_TEST, async (_event, { providerId }: { providerId: string }) => {
    const all = await providerService.listProviders()
    const provider = all.find((p) => p.id === providerId)
    if (!provider) return { ok: false, error: 'Provider not found' }
    if (!provider.apiKey && provider.defaultEndpointType !== 'openai_chat_completions') {
      return { ok: false, error: 'No API key configured' }
    }
    try {
      const { createOpenAI } = await import('@ai-sdk/openai')
      const { createAnthropic } = await import('@ai-sdk/anthropic')
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google')
      const { generateText } = await import('ai')

      let model
      if (provider.defaultEndpointType === 'anthropic_messages') {
        const sdk = createAnthropic({ apiKey: provider.apiKey })
        model = sdk('claude-haiku-4-5-20251001')
      } else if (provider.defaultEndpointType === 'google_gemini') {
        const sdk = createGoogleGenerativeAI({ apiKey: provider.apiKey })
        model = sdk('gemini-2.0-flash')
      } else {
        const cfg: Parameters<typeof createOpenAI>[0] = { apiKey: provider.apiKey || 'no-key' }
        if (provider.apiHost) cfg.baseURL = provider.apiHost
        const sdk = createOpenAI(cfg)
        model = sdk('gpt-4o-mini')
      }
      const res = await generateText({ model, messages: [{ role: 'user', content: 'Reply with one word: OK' }], maxTokens: 5 })
      return { ok: true, text: res.text.trim() }
    } catch (e) {
      return { ok: false, error: (e as Error).message?.slice(0, 200) ?? 'Unknown error' }
    }
  })

  ipcMain.handle(IpcChannel.STORAGE_INFO, async () => {
    const { stat } = await import('fs/promises')
    const { app } = await import('electron')
    const dbPath = app.getPath('userData') + '/db.sqlite'
    try {
      const s = await stat(dbPath)
      return { dbPath, dbSize: s.size, userData: app.getPath('userData') }
    } catch {
      return { dbPath, dbSize: 0, userData: app.getPath('userData') }
    }
  })

  ipcMain.handle(IpcChannel.FILE_SELECT, async (_event, { multiple = false, filters }: { multiple?: boolean; filters?: Electron.FileFilter[] } = {}) => {
    const { dialog } = await import('electron')
    const result = await dialog.showOpenDialog({
      properties: multiple ? ['openFile', 'multiSelections'] : ['openFile'],
      filters: filters ?? [{ name: 'All Files', extensions: ['*'] }]
    })
    return result.canceled ? [] : result.filePaths
  })

  ipcMain.handle(IpcChannel.FILE_READ, async (_event, filePath: string) => {
    const { readFile } = await import('fs/promises')
    return readFile(filePath, 'utf8')
  })

  ipcMain.handle(IpcChannel.OPEN_PATH, (_event, p: string) => {
    shell.openPath(p)
  })

  ipcMain.handle(IpcChannel.OPEN_WEBSITE, (_event, url: string) => {
    shell.openExternal(url)
  })

  // ── Backup ───────────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.BACKUP_EXPORT, async () => {
    const [providers, assistants, notes] = await Promise.all([
      providerService.listProviders(),
      assistantService.list(),
      noteService.list()
    ])

    // Gather all messages for all topics across all assistants
    const topicsAll: unknown[] = []
    const messagesAll: unknown[] = []
    for (const a of assistants) {
      const topics = await topicService.listByAssistant(a.id)
      for (const t of topics) {
        topicsAll.push(t)
        const msgs = await messageService.listByTopic(t.id)
        messagesAll.push(...msgs)
      }
    }

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      providers,
      assistants,
      topics: topicsAll,
      messages: messagesAll,
      notes
    }

    const { dialog, writeFile: _wf } = await Promise.all([
      import('electron').then(m => m.dialog),
      import('fs/promises')
    ]).then(([d, fs]) => ({ dialog: d, writeFile: fs.writeFile }))

    const result = await dialog.showSaveDialog({
      defaultPath: `cherry-studio-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON Backup', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return null

    const { writeFile } = await import('fs/promises')
    await writeFile(result.filePath, JSON.stringify(backup, null, 2), 'utf8')
    shell.showItemInFolder(result.filePath)
    return result.filePath
  })

  ipcMain.handle(IpcChannel.BACKUP_IMPORT, async () => {
    const { dialog } = await import('electron')
    const { readFile } = await import('fs/promises')

    const result = await dialog.showOpenDialog({
      filters: [{ name: 'JSON Backup', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (result.canceled || !result.filePaths[0]) return { success: false, reason: 'Cancelled' }

    try {
      const raw = await readFile(result.filePaths[0], 'utf8')
      const backup = JSON.parse(raw) as {
        version: number
        providers?: unknown[]
        assistants?: unknown[]
        topics?: unknown[]
        messages?: unknown[]
        notes?: unknown[]
      }
      if (backup.version !== 1) return { success: false, reason: 'Unsupported backup version' }

      // Import: upsert each entity
      for (const p of backup.providers ?? []) await providerService.upsertProvider(p as Parameters<typeof providerService.upsertProvider>[0])
      for (const a of backup.assistants ?? []) await assistantService.upsert(a as Parameters<typeof assistantService.upsert>[0])
      for (const n of backup.notes ?? []) await noteService.create(n as Parameters<typeof noteService.create>[0])

      return { success: true }
    } catch (err) {
      return { success: false, reason: String(err) }
    }
  })

  // ── Notifications ────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.NOTIFY, (_event, { title, body }: { title: string; body: string }) => {
    const { Notification } = require('electron') as typeof import('electron')
    if (Notification.isSupported()) {
      const notif = new Notification({ title, body })
      notif.on('click', () => {
        const win = BrowserWindow.getAllWindows()[0]
        if (win) { win.show(); win.focus() }
      })
      notif.show()
    }
  })

  // ── App ─────────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.APP_VERSION, () => {
    return process.env.npm_package_version ?? '0.1.0'
  })

  logger.info('All IPC handlers registered')
}

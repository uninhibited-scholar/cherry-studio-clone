import { ipcMain } from 'electron'
import { IpcChannel } from '@shared/IpcChannel'
import { loggerService } from '@logger'
import { aiService } from './ai/AiService'

const logger = loggerService.withContext('IPC')

/**
 * Register all IPC handlers.
 * Called once during application bootstrap.
 *
 * Pattern: ipcMain.handle(channel, async (_event, ...args) => { ... })
 * Use ipcMain.on for fire-and-forget; ipcMain.handle for request/response.
 */
export function registerIpcHandlers(): void {
  // ── AI ──────────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.AI_CHAT, async (event, params) => {
    const { requestId, providerId, modelId, messages, systemPrompt } = params

    await aiService.streamChat({
      requestId,
      providerId,
      modelId,
      messages,
      systemPrompt,
      onChunk: (chunk) => {
        // Push chunks back to the specific renderer window
        if (!event.sender.isDestroyed()) {
          event.sender.send(IpcChannel.AI_STREAM_CHUNK, { requestId, chunk })
        }
      }
    })
  })

  ipcMain.on(IpcChannel.AI_ABORT, (_event, requestId: string) => {
    aiService.abort(requestId)
  })

  // ── App ──────────────────────────────────────────────────────────────────
  ipcMain.handle(IpcChannel.APP_VERSION, () => {
    return process.env.npm_package_version ?? '0.1.0'
  })

  logger.info('IPC handlers registered')
}

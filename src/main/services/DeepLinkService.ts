import { BrowserWindow } from 'electron'
import { IpcChannel } from '@shared/IpcChannel'
import { loggerService } from '@logger'

const logger = loggerService.withContext('DeepLinkService')

export class DeepLinkService {
  private win: BrowserWindow | null = null

  setMainWindow(win: BrowserWindow): void {
    this.win = win
  }

  handle(url: string): void {
    logger.info('Deep link received', { url })
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      logger.warn('Invalid deep link URL', { url })
      return
    }

    if (parsed.protocol !== 'cherry:') return

    // Focus / restore the main window first
    if (this.win) {
      if (this.win.isMinimized()) this.win.restore()
      this.win.show()
      this.win.focus()
    }

    const host = parsed.hostname // e.g. "chat", "settings", "quick-assistant"
    const [, ...segments] = parsed.pathname.split('/') // pathname is e.g. "/new" or "/{topicId}"

    if (host === 'chat') {
      const sub = segments[0]
      if (!sub || sub === 'new') {
        this.win?.webContents.send(IpcChannel.SHORTCUT_NEW_TOPIC)
      } else {
        this.win?.webContents.send(IpcChannel.DEEP_LINK_OPEN_TOPIC, sub)
      }
    } else if (host === 'settings') {
      const section = segments[0] ?? ''
      this.win?.webContents.send(IpcChannel.DEEP_LINK_OPEN_SETTINGS, section)
    } else if (host === 'quick-assistant') {
      this.win?.webContents.send(IpcChannel.DEEP_LINK)
    } else {
      logger.warn('Unrecognised deep link host', { host })
    }
  }
}

export const deepLinkService = new DeepLinkService()

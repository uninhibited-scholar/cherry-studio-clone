import { BrowserWindow, globalShortcut } from 'electron'
import { IpcChannel } from '@shared/IpcChannel'
import { loggerService } from '@logger'

const logger = loggerService.withContext('ShortcutService')

const SHORTCUTS: Array<{ accelerator: string; channel: string }> = [
  { accelerator: 'CommandOrControl+N', channel: IpcChannel.SHORTCUT_NEW_TOPIC },
  { accelerator: 'CommandOrControl+K', channel: IpcChannel.SHORTCUT_COMMAND_PALETTE },
  { accelerator: 'CommandOrControl+,', channel: IpcChannel.SHORTCUT_SETTINGS },
  { accelerator: 'CommandOrControl+F', channel: IpcChannel.SHORTCUT_FIND }
]

export class ShortcutService {
  private win: BrowserWindow | null = null

  registerAll(win: BrowserWindow): void {
    this.win = win
    for (const { accelerator, channel } of SHORTCUTS) {
      const ok = globalShortcut.register(accelerator, () => {
        this.win?.webContents.send(channel)
      })
      if (!ok) {
        logger.warn(`Failed to register shortcut ${accelerator}`)
      }
    }
  }

  unregisterAll(): void {
    for (const { accelerator } of SHORTCUTS) {
      globalShortcut.unregister(accelerator)
    }
    this.win = null
  }
}

export const shortcutService = new ShortcutService()

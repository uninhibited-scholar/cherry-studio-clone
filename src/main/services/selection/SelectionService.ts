import { globalShortcut, clipboard } from 'electron'
import { loggerService } from '@logger'
import { selectionAssistantWindow } from '../../core/window/SelectionAssistantWindow'

const logger = loggerService.withContext('SelectionService')

const SHORTCUT = process.platform === 'darwin' ? 'Command+Shift+A' : 'Ctrl+Shift+A'

class SelectionService {
  registerShortcut(): void {
    const registered = globalShortcut.register(SHORTCUT, () => {
      const text = clipboard.readText()
      logger.info('Selection assistant triggered', { hasText: !!text })
      selectionAssistantWindow.show()
    })

    if (!registered) {
      logger.warn(`Failed to register shortcut ${SHORTCUT}`)
    } else {
      logger.info(`Selection assistant shortcut registered: ${SHORTCUT}`)
    }
  }

  unregisterShortcut(): void {
    globalShortcut.unregister(SHORTCUT)
  }
}

export const selectionService = new SelectionService()

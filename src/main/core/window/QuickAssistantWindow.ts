import { BrowserWindow, globalShortcut, screen } from 'electron'
import { loggerService } from '@logger'

const logger = loggerService.withContext('QuickAssistantWindow')

const QUICK_ASSISTANT_WIDTH = 680
const QUICK_ASSISTANT_HEIGHT = 520

export class QuickAssistantWindow {
  private win: BrowserWindow | null = null

  create(): void {
    if (this.win) return

    const preloadPath = `${__dirname}/../preload/index.js`

    this.win = new BrowserWindow({
      width: QUICK_ASSISTANT_WIDTH,
      height: QUICK_ASSISTANT_HEIGHT,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      show: false,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    })

    if (process.env.ELECTRON_RENDERER_URL) {
      this.win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/quick-assistant.html`)
    } else {
      this.win.loadFile(`${__dirname}/../renderer/quick-assistant.html`)
    }

    // Hide instead of close when the user closes the window
    this.win.on('close', (e) => {
      e.preventDefault()
      this.hide()
    })

    // Hide when window loses focus
    this.win.on('blur', () => {
      this.hide()
    })

    logger.info('Quick Assistant window created')
  }

  toggle(): void {
    if (!this.win) return
    if (this.win.isVisible()) {
      this.hide()
    } else {
      this.show()
    }
  }

  show(): void {
    if (!this.win) return
    this.center()
    this.win.show()
    this.win.focus()
  }

  hide(): void {
    if (!this.win) return
    this.win.hide()
  }

  private center(): void {
    if (!this.win) return
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
    const x = Math.round((sw - QUICK_ASSISTANT_WIDTH) / 2)
    const y = Math.round((sh - QUICK_ASSISTANT_HEIGHT) / 2)
    this.win.setPosition(x, y)
  }

  registerShortcut(): void {
    const registered = globalShortcut.register('CommandOrControl+Shift+Space', () => {
      this.toggle()
    })
    if (!registered) {
      logger.warn('Failed to register Quick Assistant shortcut CommandOrControl+Shift+Space')
    } else {
      logger.info('Quick Assistant shortcut registered')
    }
  }

  unregisterShortcut(): void {
    globalShortcut.unregister('CommandOrControl+Shift+Space')
  }

  getWindow(): BrowserWindow | null {
    return this.win
  }
}

export const quickAssistantWindow = new QuickAssistantWindow()

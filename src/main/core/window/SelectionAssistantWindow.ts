import { BrowserWindow, screen } from 'electron'
import { loggerService } from '@logger'

const logger = loggerService.withContext('SelectionAssistantWindow')

const WIDTH = 500
const HEIGHT = 400

class SelectionAssistantWindow {
  private win: BrowserWindow | null = null

  create(): void {
    if (this.win) return

    const preloadPath = `${__dirname}/../preload/index.js`

    this.win = new BrowserWindow({
      width: WIDTH,
      height: HEIGHT,
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
      this.win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/selection-assistant.html`)
    } else {
      this.win.loadFile(`${__dirname}/../renderer/selection-assistant.html`)
    }

    this.win.on('close', (e) => {
      e.preventDefault()
      this.hide()
    })

    this.win.on('blur', () => {
      this.hide()
    })

    logger.info('Selection Assistant window created')
  }

  show(): void {
    if (!this.win) this.create()
    if (!this.win) return

    const cursor = screen.getCursorScreenPoint()
    const display = screen.getDisplayNearestPoint(cursor)
    const bounds = display.workArea

    let x = cursor.x + 10
    let y = cursor.y + 10

    // Keep within display bounds
    if (x + WIDTH > bounds.x + bounds.width) x = cursor.x - WIDTH - 10
    if (y + HEIGHT > bounds.y + bounds.height) y = cursor.y - HEIGHT - 10

    this.win.setPosition(Math.max(bounds.x, x), Math.max(bounds.y, y))
    this.win.show()
    this.win.focus()
  }

  hide(): void {
    this.win?.hide()
  }

  toggle(): void {
    if (this.win?.isVisible()) {
      this.hide()
    } else {
      this.show()
    }
  }
}

export const selectionAssistantWindow = new SelectionAssistantWindow()

import { BrowserWindow, screen, app } from 'electron'
import fs from 'fs'
import path from 'path'

interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
}

export class WindowStateManager {
  private stateFile: string
  private state: WindowState

  constructor(windowName: string, defaults = { width: 1280, height: 800 }) {
    this.stateFile = path.join(app.getPath('userData'), `window-state-${windowName}.json`)
    this.state = this.load(defaults)
  }

  private load(defaults: { width: number; height: number }): WindowState {
    try {
      return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'))
    } catch {
      return { ...defaults, isMaximized: false }
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state), 'utf8')
    } catch {
      // ignore write errors
    }
  }

  private isValidBounds(state: WindowState): boolean {
    const displays = screen.getAllDisplays()
    return displays.some((display) => {
      const { x, y, width, height } = display.workArea
      return (
        state.x !== undefined &&
        state.y !== undefined &&
        state.x >= x &&
        state.y >= y &&
        state.x + state.width <= x + width &&
        state.y + state.height <= y + height
      )
    })
  }

  get(): WindowState {
    return this.state
  }

  track(win: BrowserWindow): void {
    win.on('close', () => {
      this.state.isMaximized = win.isMaximized()
      if (!win.isMaximized()) {
        const bounds = win.getBounds()
        const candidate: WindowState = { ...bounds, isMaximized: false }
        if (this.isValidBounds(candidate)) {
          this.state = candidate
        }
      }
      this.save()
    })
  }
}

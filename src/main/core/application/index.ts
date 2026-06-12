import { BrowserWindow } from 'electron'

/**
 * Application singleton — bootstraps all services in lifecycle order.
 *
 * Mirrors Cherry Studio's Application class:
 *   src/main/core/application/Application.ts
 *
 * Phase order:
 *   BeforeReady → WhenReady → AfterReady
 */
class Application {
  private mainWindow: BrowserWindow | null = null

  async bootstrap(): Promise<void> {
    // TODO: register services from serviceRegistry, call lifecycle phases
    await this.createMainWindow()
  }

  private async createMainWindow(): Promise<void> {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 960,
      minHeight: 600,
      webPreferences: {
        preload: __dirname + '/../preload/index.js',
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:5173')
      this.mainWindow.webContents.openDevTools()
    } else {
      this.mainWindow.loadFile(__dirname + '/../../renderer/index.html')
    }
  }

  focusMainWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) this.mainWindow.restore()
      this.mainWindow.focus()
    }
  }

  /** Get a registered service by name (stub for now) */
  get<T>(name: string): T {
    throw new Error(`Service "${name}" not yet registered`)
  }
}

export const application = new Application()

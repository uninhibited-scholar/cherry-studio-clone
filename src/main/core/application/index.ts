import { BrowserWindow, app } from 'electron'
import { MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from '@shared/config/constant'
import { loggerService } from '@logger'

const logger = loggerService.withContext('Application')

class Application {
  private mainWindow: BrowserWindow | null = null

  async bootstrap(): Promise<void> {
    logger.info('Bootstrapping application…')

    // 1. Run DB migrations (lazy import avoids early Electron path resolution issues)
    const { runMigrations } = await import('../../data/db/migrate')
    await runMigrations()

    // 2. Seed default providers on first launch
    const { seedDefaultProviders } = await import('../../data/services/DefaultProviderSeeder')
    await seedDefaultProviders()

    // 3. Register all IPC handlers
    const { registerIpcHandlers } = await import('../../ipc')
    registerIpcHandlers()

    // 3. Open main window
    await this.createMainWindow()

    logger.info('Application ready')
  }

  private async createMainWindow(): Promise<void> {
    // out/main/index.js and out/preload/index.js are always siblings under out/
    const preloadPath = `${__dirname}/../preload/index.js`

    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: MIN_WINDOW_WIDTH,
      minHeight: MIN_WINDOW_HEIGHT,
      titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    })

    if (process.env.ELECTRON_RENDERER_URL) {
      await this.mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
      this.mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
      await this.mainWindow.loadFile(`${__dirname}/../renderer/index.html`)
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })
  }

  focusMainWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) this.mainWindow.restore()
      this.mainWindow.focus()
    }
  }
}

export const application = new Application()

import { BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { IpcChannel } from '@shared/IpcChannel'
import { loggerService } from '@logger'

const logger = loggerService.withContext('UpdaterService')

class UpdaterService {
  private mainWindow: BrowserWindow | null = null

  setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win
  }

  init(): void {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('update-available', (info) => {
      this.send(IpcChannel.UPDATE_AVAILABLE, info)
    })

    autoUpdater.on('update-not-available', () => {
      this.send(IpcChannel.UPDATE_NOT_AVAILABLE)
    })

    autoUpdater.on('download-progress', (progress) => {
      this.send(IpcChannel.UPDATE_DOWNLOAD_PROGRESS, progress)
    })

    autoUpdater.on('update-downloaded', (info) => {
      this.send(IpcChannel.UPDATE_DOWNLOADED, info)
    })

    autoUpdater.on('error', (err) => {
      logger.error('Auto-updater error', err)
    })
  }

  private send(channel: string, ...args: unknown[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args)
    }
  }

  checkForUpdates() {
    return autoUpdater.checkForUpdates()
  }

  downloadUpdate() {
    return autoUpdater.downloadUpdate()
  }

  quitAndInstall() {
    autoUpdater.quitAndInstall()
  }
}

export const updaterService = new UpdaterService()

import { app, BrowserWindow, globalShortcut } from 'electron'
import { application } from './core/application'
import { createTray, destroyTray } from './services/TrayService'
import { buildAndSetAppMenu } from './services/AppMenuService'
import { quickAssistantWindow } from './core/window/QuickAssistantWindow'
import { selectionAssistantWindow } from './core/window/SelectionAssistantWindow'
import { selectionService } from './services/selection/SelectionService'
import { updaterService } from './services/UpdaterService'

// Enforce single instance
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
}

app.whenReady().then(async () => {
  buildAndSetAppMenu()
  await application.bootstrap()
  createTray()
  quickAssistantWindow.create()
  quickAssistantWindow.registerShortcut()

  // Selection Assistant
  selectionAssistantWindow.create()
  selectionService.registerShortcut()

  // Auto-updater
  updaterService.init()
  const mainWin = BrowserWindow.getAllWindows()[0]
  if (mainWin) updaterService.setMainWindow(mainWin)
  if (app.isPackaged) {
    setTimeout(() => updaterService.checkForUpdates(), 5000)
  }

  // Register zoom shortcuts
  const registerZoomShortcuts = () => {
    globalShortcut.register('CommandOrControl+Equal', () => {
      const win = BrowserWindow.getFocusedWindow()
      if (win) win.webContents.zoomFactor = Math.min(2, win.webContents.zoomFactor + 0.1)
    })
    globalShortcut.register('CommandOrControl+Minus', () => {
      const win = BrowserWindow.getFocusedWindow()
      if (win) win.webContents.zoomFactor = Math.max(0.5, win.webContents.zoomFactor - 0.1)
    })
    globalShortcut.register('CommandOrControl+0', () => {
      const win = BrowserWindow.getFocusedWindow()
      if (win) win.webContents.zoomFactor = 1
    })
  }
  registerZoomShortcuts()
})

// Keep the app alive in the tray when the last window is closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // On Windows/Linux quit only when no tray icon is present.
    // Since we always create one, we intentionally keep the process alive.
    // Users can quit via the tray context menu.
  }
})

app.on('will-quit', () => {
  quickAssistantWindow.unregisterShortcut()
  selectionService.unregisterShortcut()
})

app.on('before-quit', () => {
  destroyTray()
})

app.on('second-instance', () => {
  application.focusMainWindow()
})

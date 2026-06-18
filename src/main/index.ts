import { app } from 'electron'
import { application } from './core/application'
import { createTray, destroyTray } from './services/TrayService'

// Enforce single instance
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
}

app.whenReady().then(async () => {
  await application.bootstrap()
  createTray()
})

// Keep the app alive in the tray when the last window is closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // On Windows/Linux quit only when no tray icon is present.
    // Since we always create one, we intentionally keep the process alive.
    // Users can quit via the tray context menu.
  }
})

app.on('before-quit', () => {
  destroyTray()
})

app.on('second-instance', () => {
  application.focusMainWindow()
})

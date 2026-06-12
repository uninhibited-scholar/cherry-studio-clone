import { app } from 'electron'
import { application } from './core/application'

// Enforce single instance
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
}

app.whenReady().then(async () => {
  await application.bootstrap()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('second-instance', () => {
  application.focusMainWindow()
})

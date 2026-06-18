import { Menu, app, shell, BrowserWindow } from 'electron'
import { loggerService } from '@logger'

const logger = loggerService.withContext('AppMenuService')

function getMainWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] ?? null
}

export function buildAndSetAppMenu(): void {
  const isMac = process.platform === 'darwin'
  const appName = app.getName()

  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(isMac
      ? [
          {
            label: appName,
            submenu: [
              { label: `About ${appName}`, role: 'about' as const },
              { type: 'separator' as const },
              { label: 'Hide', role: 'hide' as const },
              { label: 'Hide Others', role: 'hideOthers' as const },
              { label: 'Show All', role: 'unhide' as const },
              { type: 'separator' as const },
              { label: 'Quit', role: 'quit' as const }
            ]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Topic',
          accelerator: 'CmdOrCtrl+N',
          click() {
            getMainWindow()?.webContents.send('menu:new-topic')
          }
        },
        { type: 'separator' },
        {
          label: 'Export Conversation…',
          accelerator: 'CmdOrCtrl+E',
          click() {
            getMainWindow()?.webContents.send('menu:export-topic')
          }
        },
        { type: 'separator' },
        isMac ? { label: 'Close Window', role: 'close' as const } : { label: 'Exit', role: 'quit' as const }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', role: 'undo' as const },
        { label: 'Redo', role: 'redo' as const },
        { type: 'separator' },
        { label: 'Cut', role: 'cut' as const },
        { label: 'Copy', role: 'copy' as const },
        { label: 'Paste', role: 'paste' as const },
        { label: 'Select All', role: 'selectAll' as const }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Find in Page…',
          accelerator: 'CmdOrCtrl+F',
          click() {
            const win = getMainWindow()
            if (win) win.webContents.executeJavaScript('window.dispatchEvent(new CustomEvent("app:find-in-page"))')
          }
        },
        { type: 'separator' },
        { label: 'Reload', role: 'reload' as const },
        { label: 'Force Reload', role: 'forceReload' as const },
        { label: 'Toggle Developer Tools', role: 'toggleDevTools' as const },
        { type: 'separator' },
        { label: 'Reset Zoom', role: 'resetZoom' as const },
        { label: 'Zoom In', role: 'zoomIn' as const },
        { label: 'Zoom Out', role: 'zoomOut' as const },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', role: 'togglefullscreen' as const }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', role: 'minimize' as const },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { label: 'Bring All to Front', role: 'front' as const }
            ]
          : [{ label: 'Close', role: 'close' as const }])
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'GitHub Repository',
          click() {
            shell.openExternal('https://github.com/uninhibited-scholar/cherry-studio-clone')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  logger.info('App menu set')
}

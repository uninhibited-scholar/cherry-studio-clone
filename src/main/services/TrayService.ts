import { Tray, Menu, nativeImage, app, globalShortcut } from 'electron'
import path from 'path'
import { loggerService } from '@logger'

const logger = loggerService.withContext('TrayService')

let tray: Tray | null = null

function getMainWindow() {
  return BrowserWindow.getAllWindows()[0] ?? null
}

function buildMenu(): Electron.Menu {
  return Menu.buildFromTemplate([
    {
      label: 'Show / Hide',
      click() {
        const win = getMainWindow()
        if (!win) return
        if (win.isVisible() && win.isFocused()) {
          win.hide()
        } else {
          win.show()
          win.focus()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Cherry Studio',
      click() {
        app.quit()
      }
    }
  ])
}

export function createTray(): void {
  if (tray) return

  // Use a tiny 16×16 monochrome icon generated from a data URI.
  // On macOS the tray renders template images in the menu bar.
  const img = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA' +
    'AAABJRU5ErkJggg=='
  )

  // Prefer the bundled asset when it exists.
  const assetPath = path.join(__dirname, '../renderer/assets/tray-icon.png')
  let icon: Electron.NativeImage
  try {
    const fromAsset = nativeImage.createFromPath(assetPath)
    icon = fromAsset.isEmpty() ? img : fromAsset
  } catch {
    icon = img
  }

  if (process.platform === 'darwin') {
    icon = icon.resize({ width: 16, height: 16 })
    icon.setTemplateImage(true)
  }

  tray = new Tray(icon)
  tray.setToolTip('Cherry Studio')
  tray.setContextMenu(buildMenu())

  // macOS: click shows the context menu; double-click toggles window.
  tray.on('double-click', () => {
    const win = getMainWindow()
    if (!win) return
    win.isVisible() ? win.hide() : win.show()
  })

  // Global shortcut: Ctrl+Shift+Space (or Cmd+Shift+Space on macOS) to focus main window
  const shortcut = process.platform === 'darwin' ? 'Command+Shift+Space' : 'Ctrl+Shift+Space'
  const registered = globalShortcut.register(shortcut, () => {
    const win = getMainWindow()
    if (!win) return
    if (win.isVisible() && win.isFocused()) {
      win.hide()
    } else {
      win.show()
      win.focus()
    }
  })
  if (!registered) logger.warn(`Failed to register global shortcut: ${shortcut}`)
  else logger.info(`Global shortcut registered: ${shortcut}`)

  logger.info('Tray created')
}

export function destroyTray(): void {
  globalShortcut.unregisterAll()
  if (tray) {
    tray.destroy()
    tray = null
    logger.info('Tray destroyed')
  }
}

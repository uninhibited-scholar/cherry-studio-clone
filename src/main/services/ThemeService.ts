import { app, nativeTheme, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { IpcChannel } from '@shared/IpcChannel'
import { loggerService } from '@logger'

const logger = loggerService.withContext('ThemeService')

type ThemeSetting = 'dark' | 'light' | 'system'

interface ThemeConfig {
  theme: ThemeSetting
}

class ThemeService {
  private configPath: string
  private theme: ThemeSetting = 'dark'

  constructor() {
    this.configPath = join(app.getPath('userData'), 'theme.json')
    this.load()

    nativeTheme.on('updated', () => {
      if (this.theme === 'system') {
        this.broadcast()
      }
    })
  }

  private load(): void {
    try {
      if (existsSync(this.configPath)) {
        const raw = readFileSync(this.configPath, 'utf-8')
        const parsed: ThemeConfig = JSON.parse(raw)
        if (['dark', 'light', 'system'].includes(parsed.theme)) {
          this.theme = parsed.theme
        }
      }
    } catch (e) {
      logger.warn('Failed to load theme config', e)
    }
  }

  private save(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify({ theme: this.theme }), 'utf-8')
    } catch (e) {
      logger.warn('Failed to save theme config', e)
    }
  }

  private broadcast(): void {
    const effective = this.resolveEffectiveTheme()
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IpcChannel.THEME_CHANGED, { theme: this.theme, effective })
      }
    })
  }

  getTheme(): { theme: ThemeSetting; effective: 'dark' | 'light' } {
    return { theme: this.theme, effective: this.resolveEffectiveTheme() }
  }

  setTheme(theme: ThemeSetting): void {
    this.theme = theme
    this.save()
    this.broadcast()
  }

  resolveEffectiveTheme(): 'dark' | 'light' {
    if (this.theme === 'system') {
      return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    }
    return this.theme
  }
}

export const themeService = new ThemeService()

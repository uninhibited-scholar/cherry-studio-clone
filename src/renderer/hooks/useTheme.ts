import { useEffect, useState } from 'react'
import { IpcChannel } from '@shared/IpcChannel'

type ThemeSetting = 'dark' | 'light' | 'system'
type EffectiveTheme = 'dark' | 'light'

function applyTheme(effective: EffectiveTheme): void {
  document.documentElement.setAttribute('data-theme', effective)
  document.documentElement.style.colorScheme = effective
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeSetting>('system')
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>('dark')

  useEffect(() => {
    // Read current theme from main on mount
    window.api.invoke(IpcChannel.THEME_GET).then((result) => {
      const { theme: t, effective } = result as { theme: ThemeSetting; effective: EffectiveTheme }
      setThemeState(t)
      setEffectiveTheme(effective)
      applyTheme(effective)
    })

    // Listen for theme changes pushed from main
    const off = window.api.on(IpcChannel.THEME_CHANGED, (...args) => {
      const { theme: t, effective } = args[0] as { theme: ThemeSetting; effective: EffectiveTheme }
      setThemeState(t)
      setEffectiveTheme(effective)
      applyTheme(effective)
    })

    return off
  }, [])

  const setTheme = (t: ThemeSetting) => {
    window.api.invoke(IpcChannel.THEME_SET, t)
  }

  return { theme, effectiveTheme, setTheme }
}

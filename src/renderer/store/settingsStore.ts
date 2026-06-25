import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'
type FontSize = 'sm' | 'md' | 'lg'

interface SettingsStore {
  theme: Theme
  fontSize: FontSize
  language: string
  sendOnEnter: boolean

  setTheme(theme: Theme): void
  setFontSize(fontSize: FontSize): void
  setLanguage(language: string): void
  setSendOnEnter(sendOnEnter: boolean): void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'system',
      fontSize: 'md',
      language: 'en',
      sendOnEnter: true,

      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLanguage: (language) => set({ language }),
      setSendOnEnter: (sendOnEnter) => set({ sendOnEnter })
    }),
    {
      name: 'cherry-clone:settings'
    }
  )
)

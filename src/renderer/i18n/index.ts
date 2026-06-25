import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { zh } from './locales/zh'

const savedLanguage = (() => {
  try {
    const settings = localStorage.getItem('cherry-clone:settings')
    if (settings) {
      const parsed = JSON.parse(settings) as { state?: { language?: string } }
      return parsed?.state?.language ?? 'en'
    }
  } catch {
    // ignore parse errors
  }
  return 'en'
})()

i18n
  .use(initReactI18next)
  .init({
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    resources: {
      en,
      zh
    }
  })

export default i18n

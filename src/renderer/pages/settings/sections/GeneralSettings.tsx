import React, { useState, useEffect, useCallback } from 'react'
import { IpcChannel } from '@shared/IpcChannel'

type GeneralPrefs = {
  fontSize: number
  sendOnEnter: boolean
  showTimestamps: boolean
  autoScrollToBottom: boolean
  theme: 'dark' | 'light'
  language: 'en' | 'zh'
  useProxy: boolean
  proxyUrl: string
}

const DEFAULT_PREFS: GeneralPrefs = {
  fontSize: 14,
  sendOnEnter: true,
  showTimestamps: false,
  autoScrollToBottom: true,
  theme: 'dark',
  language: 'en',
  useProxy: false,
  proxyUrl: ''
}

const PREFS_KEY = 'cherry-studio-clone:general-prefs'

export function loadGeneralPrefs(): GeneralPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export function GeneralSettings(): React.ReactElement {
  const [prefs, setPrefs] = useState<GeneralPrefs>(loadGeneralPrefs)
  const [saved, setSaved] = useState(false)
  const [launchOnBoot, setLaunchOnBoot] = useState(false)

  useEffect(() => {
    document.documentElement.style.setProperty('--chat-font-size', `${prefs.fontSize}px`)
    const isDark = prefs.theme === 'dark'
    document.documentElement.style.colorScheme = prefs.theme
    document.documentElement.style.background = isDark ? '#09090b' : '#fafafa'
    document.documentElement.style.color = isDark ? '#fafafa' : '#09090b'
  }, [prefs.fontSize, prefs.theme])

  useEffect(() => {
    window.api.invoke(IpcChannel.APP_LAUNCH_ON_BOOT_GET).then((v) => setLaunchOnBoot(v as boolean))
  }, [])

  const toggleLaunchOnBoot = useCallback(async (enabled: boolean) => {
    await window.api.invoke(IpcChannel.APP_LAUNCH_ON_BOOT_SET, enabled)
    setLaunchOnBoot(enabled)
  }, [])

  function update<K extends keyof GeneralPrefs>(key: K, value: GeneralPrefs[K]) {
    setPrefs((p) => ({ ...p, [key]: value }))
  }

  function save() {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const label: React.CSSProperties = { fontSize: 13, color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }
  const sublabel: React.CSSProperties = { fontSize: 11, color: '#71717a', marginTop: 2 }
  const row: React.CSSProperties = { marginBottom: 20, padding: '14px 16px', background: '#18181b', borderRadius: 10, border: '1px solid #27272a' }

  return (
    <div>
      <h2 style={{ color: '#fafafa', fontSize: 18, marginBottom: 4 }}>General</h2>
      <p style={{ color: '#71717a', fontSize: 13, marginBottom: 24 }}>App-wide preferences stored locally.</p>

      <div style={row}>
        <p style={{ ...label, cursor: 'default', marginBottom: 10 }}>Chat Font Size: {prefs.fontSize}px</p>
        <input
          type="range" min={11} max={20} value={prefs.fontSize}
          onChange={(e) => update('fontSize', Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={sublabel}>11px</span>
          <span style={sublabel}>20px</span>
        </div>
      </div>

      <div style={row}>
        <p style={{ ...label, cursor: 'default', marginBottom: 10 }}>Theme</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              onClick={() => update('theme', t)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: prefs.theme === t ? '2px solid #2563eb' : '1px solid #3f3f46',
                background: prefs.theme === t ? 'rgba(37,99,235,0.1)' : '#27272a',
                color: prefs.theme === t ? '#60a5fa' : '#a1a1aa',
                cursor: 'pointer',
                fontSize: 12,
                textTransform: 'capitalize'
              }}
            >
              {t === 'dark' ? '🌙' : '☀️'} {t}
            </button>
          ))}
        </div>
      </div>

      <div style={row}>
        <p style={{ ...label, cursor: 'default', marginBottom: 10 }}>Language</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['en', 'zh'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => update('language', lang)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: prefs.language === lang ? '2px solid #2563eb' : '1px solid #3f3f46',
                background: prefs.language === lang ? 'rgba(37,99,235,0.1)' : '#27272a',
                color: prefs.language === lang ? '#60a5fa' : '#a1a1aa',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              {lang === 'en' ? '🇬🇧 English' : '🇨🇳 中文'}
            </button>
          ))}
        </div>
      </div>

      <div style={row}>
        <label style={label}>
          <input
            type="checkbox" checked={prefs.sendOnEnter}
            onChange={(e) => update('sendOnEnter', e.target.checked)}
          />
          Send on Enter
        </label>
        <p style={sublabel}>Press Enter to send; Shift+Enter for newline.</p>
      </div>

      <div style={row}>
        <label style={label}>
          <input
            type="checkbox" checked={prefs.showTimestamps}
            onChange={(e) => update('showTimestamps', e.target.checked)}
          />
          Show message timestamps
        </label>
        <p style={sublabel}>Display time sent beneath each message bubble.</p>
      </div>

      <div style={row}>
        <label style={label}>
          <input
            type="checkbox" checked={prefs.autoScrollToBottom}
            onChange={(e) => update('autoScrollToBottom', e.target.checked)}
          />
          Auto-scroll to bottom on new message
        </label>
      </div>

      <div style={row}>
        <label style={label}>
          <input
            type="checkbox" checked={launchOnBoot}
            onChange={(e) => toggleLaunchOnBoot(e.target.checked)}
          />
          Launch on system startup
        </label>
        <p style={sublabel}>Start Cherry Studio automatically when you log in.</p>
      </div>

      <div style={row}>
        <label style={label}>
          <input
            type="checkbox" checked={prefs.useProxy}
            onChange={(e) => update('useProxy', e.target.checked)}
          />
          Use HTTP Proxy
        </label>
        <p style={sublabel}>Enable proxy for API requests (optional).</p>
        {prefs.useProxy && (
          <input
            type="text"
            value={prefs.proxyUrl}
            onChange={(e) => update('proxyUrl', e.target.value)}
            placeholder="http://proxy.example.com:8080"
            style={{
              marginTop: 8, width: '100%', background: '#27272a', border: '1px solid #3f3f46',
              borderRadius: 6, color: '#fafafa', fontSize: 12, padding: '6px 10px', outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        )}
      </div>

      <button
        onClick={save}
        style={{
          padding: '8px 20px', borderRadius: 6, border: 'none',
          background: saved ? '#16a34a' : '#2563eb', color: 'white',
          cursor: 'pointer', fontSize: 13, transition: 'background 0.2s'
        }}
      >
        {saved ? '✓ Saved' : 'Save'}
      </button>
    </div>
  )
}

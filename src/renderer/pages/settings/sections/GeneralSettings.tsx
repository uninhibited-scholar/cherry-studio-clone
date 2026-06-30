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

  const rowCls = 'mb-5 px-4 py-[14px] bg-[rgba(255,255,255,0.04)] rounded-[10px] border border-[rgba(240,171,252,0.10)]'
  const labelCls = 'text-[13px] text-[#e4e4e7] flex items-center gap-[10px] cursor-pointer'
  const sublabelCls = 'text-[11px] text-[#71717a] mt-[2px]'

  return (
    <div>
      <h2 className="text-[#fafafa] text-[18px] mb-1">General</h2>
      <p className="text-[#71717a] text-[13px] mb-6">App-wide preferences stored locally.</p>

      <div className={rowCls}>
        <p className="text-[13px] text-[#e4e4e7] flex items-center gap-[10px] cursor-default mb-[10px]">Chat Font Size: {prefs.fontSize}px</p>
        <input
          type="range" min={11} max={20} value={prefs.fontSize}
          onChange={(e) => update('fontSize', Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between">
          <span className={sublabelCls}>11px</span>
          <span className={sublabelCls}>20px</span>
        </div>
      </div>

      <div className={rowCls}>
        <p className="text-[13px] text-[#e4e4e7] flex items-center gap-[10px] cursor-default mb-[10px]">Theme</p>
        <div className="flex gap-2">
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              onClick={() => update('theme', t)}
              className={`px-[14px] py-[6px] rounded-[6px] cursor-pointer text-[12px] capitalize ${prefs.theme === t ? 'border-2 border-[#2563eb] bg-[rgba(37,99,235,0.1)] text-[#60a5fa]' : 'border border-[rgba(240,171,252,0.15)] bg-[#27272a] text-[#a1a1aa]'}`}
            >
              {t === 'dark' ? '🌙' : '☀️'} {t}
            </button>
          ))}
        </div>
      </div>

      <div className={rowCls}>
        <p className="text-[13px] text-[#e4e4e7] flex items-center gap-[10px] cursor-default mb-[10px]">Language</p>
        <div className="flex gap-2">
          {(['en', 'zh'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => update('language', lang)}
              className={`px-[14px] py-[6px] rounded-[6px] cursor-pointer text-[12px] ${prefs.language === lang ? 'border-2 border-[#2563eb] bg-[rgba(37,99,235,0.1)] text-[#60a5fa]' : 'border border-[rgba(240,171,252,0.15)] bg-[#27272a] text-[#a1a1aa]'}`}
            >
              {lang === 'en' ? '🇬🇧 English' : '🇨🇳 中文'}
            </button>
          ))}
        </div>
      </div>

      <div className={rowCls}>
        <label className={labelCls}>
          <input
            type="checkbox" checked={prefs.sendOnEnter}
            onChange={(e) => update('sendOnEnter', e.target.checked)}
          />
          Send on Enter
        </label>
        <p className={sublabelCls}>Press Enter to send; Shift+Enter for newline.</p>
      </div>

      <div className={rowCls}>
        <label className={labelCls}>
          <input
            type="checkbox" checked={prefs.showTimestamps}
            onChange={(e) => update('showTimestamps', e.target.checked)}
          />
          Show message timestamps
        </label>
        <p className={sublabelCls}>Display time sent beneath each message bubble.</p>
      </div>

      <div className={rowCls}>
        <label className={labelCls}>
          <input
            type="checkbox" checked={prefs.autoScrollToBottom}
            onChange={(e) => update('autoScrollToBottom', e.target.checked)}
          />
          Auto-scroll to bottom on new message
        </label>
      </div>

      <div className={rowCls}>
        <label className={labelCls}>
          <input
            type="checkbox" checked={launchOnBoot}
            onChange={(e) => toggleLaunchOnBoot(e.target.checked)}
          />
          Launch on system startup
        </label>
        <p className={sublabelCls}>Start Cherry Studio automatically when you log in.</p>
      </div>

      <div className={rowCls}>
        <label className={labelCls}>
          <input
            type="checkbox" checked={prefs.useProxy}
            onChange={(e) => update('useProxy', e.target.checked)}
          />
          Use HTTP Proxy
        </label>
        <p className={sublabelCls}>Enable proxy for API requests (optional).</p>
        {prefs.useProxy && (
          <input
            type="text"
            value={prefs.proxyUrl}
            onChange={(e) => update('proxyUrl', e.target.value)}
            placeholder="http://proxy.example.com:8080"
            className="mt-2 w-full bg-[#27272a] border border-[rgba(240,171,252,0.15)] rounded-[6px] text-[#fafafa] text-[12px] px-[10px] py-[6px] outline-none box-border"
          />
        )}
      </div>

      <button
        onClick={save}
        className={`px-5 py-2 rounded-[6px] border-none text-white cursor-pointer text-[13px] transition-colors duration-200 ${saved ? 'bg-[#16a34a]' : 'bg-[#2563eb]'}`}
      >
        {saved ? '✓ Saved' : 'Save'}
      </button>
    </div>
  )
}

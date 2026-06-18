import React, { useState, useEffect } from 'react'

type GeneralPrefs = {
  fontSize: number
  sendOnEnter: boolean
  showTimestamps: boolean
  autoScrollToBottom: boolean
}

const DEFAULT_PREFS: GeneralPrefs = {
  fontSize: 14,
  sendOnEnter: true,
  showTimestamps: false,
  autoScrollToBottom: true
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

  useEffect(() => {
    document.documentElement.style.setProperty('--chat-font-size', `${prefs.fontSize}px`)
  }, [prefs.fontSize])

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

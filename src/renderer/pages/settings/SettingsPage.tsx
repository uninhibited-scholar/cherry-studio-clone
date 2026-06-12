import React from 'react'

const SETTING_SECTIONS = [
  { key: 'providers', label: 'AI Providers', icon: '🔌' },
  { key: 'models', label: 'Models', icon: '🧠' },
  { key: 'appearance', label: 'Appearance', icon: '🎨' },
  { key: 'shortcuts', label: 'Shortcuts', icon: '⌨️' },
  { key: 'data', label: 'Data & Backup', icon: '💾' },
  { key: 'about', label: 'About', icon: 'ℹ️' },
]

/**
 * Settings page.
 * Sections (to implement):
 *   Providers → add/edit API keys, host URLs
 *   Models    → enable/disable, custom endpoints
 *   Appearance → theme, font, window chrome
 *   Shortcuts  → global hotkeys
 *   Data       → export, import, WebDAV sync
 *   About      → version, changelog
 */
export function SettingsPage(): React.ReactElement {
  const [active, setActive] = React.useState('providers')

  return (
    <div style={{ display: 'flex', height: '100%', background: '#09090b', color: '#fafafa' }}>
      <aside style={{ width: 200, borderRight: '1px solid #27272a', padding: '16px 8px' }}>
        {SETTING_SECTIONS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: active === key ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: active === key ? '#fafafa' : '#71717a',
              fontSize: 13,
              textAlign: 'left'
            }}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </aside>

      <div style={{ flex: 1, padding: 32, color: '#71717a' }}>
        <p style={{ fontSize: 16, color: '#fafafa', marginBottom: 8 }}>
          {SETTING_SECTIONS.find((s) => s.key === active)?.label}
        </p>
        <p style={{ fontSize: 13 }}>Implementation coming — scaffold only.</p>
      </div>
    </div>
  )
}

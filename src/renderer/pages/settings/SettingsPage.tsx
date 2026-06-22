import React, { useState, useEffect } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import { ProvidersSettings } from './sections/ProvidersSettings'
import { McpSettings } from './sections/McpSettings'
import { WebSearchSettings } from './sections/WebSearchSettings'
import { GeneralSettings } from './sections/GeneralSettings'
import { BackupSettings } from './sections/BackupSettings'
import { StorageSettings } from './sections/StorageSettings'

const SECTIONS = [
  { key: 'general', label: 'General', icon: '🛠' },
  { key: 'providers', label: 'AI Providers', icon: '🔌' },
  { key: 'mcp', label: 'MCP Servers', icon: '🔧' },
  { key: 'web-search', label: 'Web Search', icon: '🔍' },
  { key: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️' },
  { key: 'backup', label: 'Backup', icon: '💾' },
  { key: 'storage', label: 'Storage', icon: '🗄️' },
  { key: 'about', label: 'About', icon: 'ℹ️' }
]

export function SettingsPage(): React.ReactElement {
  const [active, setActive] = useState('general')

  return (
    <div style={{ display: 'flex', height: '100%', background: '#09090b', color: '#fafafa' }}>
      <aside style={{ width: 200, borderRight: '1px solid #27272a', padding: '16px 8px', flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: '#71717a', fontWeight: 600, letterSpacing: 1, padding: '0 8px', marginBottom: 8 }}>
          SETTINGS
        </p>
        {SECTIONS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none',
              cursor: 'pointer',
              background: active === key ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: active === key ? '#fafafa' : '#71717a',
              fontSize: 13, textAlign: 'left', marginBottom: 2
            }}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </aside>

      <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {active === 'general' && <GeneralSettings />}
        {active === 'providers' && <ProvidersSettings />}
        {active === 'mcp' && <McpSettings />}
        {active === 'web-search' && <WebSearchSettings />}
        {active === 'shortcuts' && <KeyboardSettings />}
        {active === 'backup' && <BackupSettings />}
        {active === 'storage' && <StorageSettings />}
        {active === 'about' && <AboutSection />}
      </div>
    </div>
  )
}

const DEFAULT_SHORTCUTS: Record<string, string> = {
  'cmd-k': 'Cmd+K',
  'cmd-n': 'Cmd+N',
  'cmd-shift-lt': 'Cmd+Shift+<',
  'cmd-shift-gt': 'Cmd+Shift+>',
  'send-message': 'Enter',
  'new-line': 'Shift+Enter',
}

function KeyboardSettings() {
  const [shortcuts, setShortcuts] = useState(() => {
    const saved = localStorage.getItem('cherry-clone:shortcuts')
    return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS
  })

  const updateShortcut = (key: string, value: string) => {
    const updated = { ...shortcuts, [key]: value }
    setShortcuts(updated)
    localStorage.setItem('cherry-clone:shortcuts', JSON.stringify(updated))
  }

  return (
    <div>
      <h2 style={{ color: '#fafafa', fontSize: 18, marginBottom: 4 }}>Keyboard Shortcuts</h2>
      <p style={{ color: '#71717a', fontSize: 13, marginBottom: 20 }}>
        Customize keyboard shortcuts for quick actions.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.entries(shortcuts).map(([action, keys]) => (
          <div key={action} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#111113', borderRadius: 8, border: '1px solid #27272a' }}>
            <span style={{ color: '#a1a1aa', fontSize: 13, minWidth: 150, textTransform: 'capitalize' }}>
              {action.replace(/-/g, ' ')}
            </span>
            <input
              value={keys as string}
              onChange={(e) => updateShortcut(action, e.target.value)}
              placeholder="e.g. Cmd+K"
              style={{
                flex: 1, background: '#27272a', border: '1px solid #3f3f46', borderRadius: 6,
                color: '#fafafa', fontSize: 12, padding: '6px 10px', outline: 'none'
              }}
            />
            <span style={{ fontSize: 11, color: '#52525b' }}>Custom</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SHORTCUTS = [
  { keys: '⌘K', label: 'Command palette' },
  { keys: '⌘N', label: 'New topic' },
  { keys: '⌘⇧<', label: 'Previous assistant' },
  { keys: '⌘⇧>', label: 'Next assistant' },
  { keys: 'Enter', label: 'Send message' },
  { keys: '⇧Enter', label: 'New line in message' },
  { keys: 'Esc', label: 'Close overlay / cancel edit' },
  { keys: 'Double-click topic', label: 'Rename topic inline' },
]

function AboutSection() {
  const [version, setVersion] = useState('…')
  const [checking, setChecking] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<{ hasUpdate: boolean; latest: string } | null>(null)

  useEffect(() => {
    window.api.invoke(IpcChannel.APP_VERSION).then((v) => setVersion(v as string))
  }, [])

  const checkUpdate = async () => {
    setChecking(true)
    try {
      const info = await window.api.invoke(IpcChannel.APP_CHECK_UPDATE) as { hasUpdate: boolean; latest: string; current: string }
      setUpdateInfo(info)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div>
      <h2 style={{ color: '#fafafa', fontSize: 18, marginBottom: 8 }}>Cherry Studio Clone</h2>
      <p style={{ color: '#71717a', fontSize: 13 }}>Version {version} · Electron + React + TypeScript</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 24 }}>
        <button
          onClick={checkUpdate}
          disabled={checking}
          style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #3f3f46', background: '#27272a', color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}
        >
          {checking ? 'Checking…' : 'Check for Updates'}
        </button>
        {updateInfo && (
          <span style={{ fontSize: 12, color: updateInfo.hasUpdate ? '#fbbf24' : '#71717a' }}>
            {updateInfo.hasUpdate ? `Update available: v${updateInfo.latest}` : 'You are up to date'}
          </span>
        )}
      </div>
      <p style={{ color: '#52525b', fontSize: 12, marginBottom: 24 }}>
        A from-scratch replication of Cherry Studio — an AI desktop client.
      </p>

      <h3 style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>KEYBOARD SHORTCUTS</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {SHORTCUTS.map(({ keys, label }) => (
          <div key={keys} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <kbd style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: 5, color: '#fafafa', fontSize: 12, minWidth: 120, padding: '3px 10px', textAlign: 'center', fontFamily: 'monospace' }}>
              {keys}
            </kbd>
            <span style={{ color: '#71717a', fontSize: 13 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

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
  { key: 'performance', label: 'Performance & Usage', icon: '📊' },
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
        {active === 'performance' && <PerformanceSettings />}
        {active === 'backup' && <BackupSettings />}
        {active === 'storage' && <StorageSettings />}
        {active === 'about' && <AboutSection />}
      </div>
    </div>
  )
}

function PerformanceSettings() {
  const [stats, setStats] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('cherry-clone:api-stats')
    return saved ? JSON.parse(saved) : {
      totalCalls: 0,
      totalTokens: 0,
      totalTime: 0,
      avgTime: 0,
      estimatedCost: 0
    }
  })

  const resetStats = () => {
    const reset = {
      totalCalls: 0,
      totalTokens: 0,
      totalTime: 0,
      avgTime: 0,
      estimatedCost: 0
    }
    setStats(reset)
    localStorage.setItem('cherry-clone:api-stats', JSON.stringify(reset))
  }

  const tokenCostEstimate = (tokens: number) => {
    // Rough estimate: $0.0005 per 1K tokens input, $0.0015 per 1K tokens output
    return (tokens / 1000) * 0.001
  }

  return (
    <div>
      <h2 style={{ color: '#fafafa', fontSize: 18, marginBottom: 4 }}>Performance & Usage</h2>
      <p style={{ color: '#71717a', fontSize: 13, marginBottom: 24 }}>API usage statistics and performance metrics.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Total API Calls */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 16 }}>
          <p style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 8 }}>Total API Calls</p>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#60a5fa' }}>{stats.totalCalls}</div>
          <p style={{ fontSize: 11, color: '#52525b', marginTop: 8 }}>API requests sent</p>
        </div>

        {/* Total Tokens */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 16 }}>
          <p style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 8 }}>Total Tokens Used</p>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#4ade80' }}>{(stats.totalTokens / 1000).toFixed(1)}K</div>
          <p style={{ fontSize: 11, color: '#52525b', marginTop: 8 }}>Input + Output tokens</p>
        </div>

        {/* Avg Response Time */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 16 }}>
          <p style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 8 }}>Avg Response Time</p>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#fbbf24' }}>{stats.avgTime.toFixed(0)}ms</div>
          <p style={{ fontSize: 11, color: '#52525b', marginTop: 8 }}>Average latency</p>
        </div>

        {/* Total Time */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 16 }}>
          <p style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 8 }}>Total API Time</p>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#a78bfa' }}>{(stats.totalTime / 1000).toFixed(1)}s</div>
          <p style={{ fontSize: 11, color: '#52525b', marginTop: 8 }}>Cumulative wait time</p>
        </div>

        {/* Estimated Cost */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 16 }}>
          <p style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 8 }}>Est. Cost</p>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#f87171' }}>${stats.estimatedCost.toFixed(3)}</div>
          <p style={{ fontSize: 11, color: '#52525b', marginTop: 8 }}>Rough API cost estimate</p>
        </div>

        {/* Efficiency */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 16 }}>
          <p style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 8 }}>Efficiency</p>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#06b6d4' }}>
            {stats.totalCalls > 0 ? (stats.totalTokens / stats.totalCalls).toFixed(0) : 0}
          </div>
          <p style={{ fontSize: 11, color: '#52525b', marginTop: 8 }}>Avg tokens per call</p>
        </div>
      </div>

      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <h3 style={{ color: '#fafafa', fontSize: 14, marginBottom: 12 }}>💡 Notes</h3>
        <ul style={{ color: '#a1a1aa', fontSize: 12, margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Statistics are calculated locally on your device.</li>
          <li>Cost estimates are rough approximations based on typical token pricing.</li>
          <li>Actual API costs depend on your provider's pricing model.</li>
          <li>Response time is measured from request sent to response received.</li>
        </ul>
      </div>

      <button
        onClick={resetStats}
        style={{
          padding: '8px 20px', borderRadius: 6, border: 'none',
          background: '#7f1d1d', color: '#fef2f2',
          cursor: 'pointer', fontSize: 13
        }}
      >
        🗑 Reset Statistics
      </button>
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

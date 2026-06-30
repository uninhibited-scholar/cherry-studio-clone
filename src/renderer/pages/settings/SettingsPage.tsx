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
    <div className="flex h-full text-[#fafafa]" style={{ background: 'transparent' }}>
      <aside className="w-[200px] px-2 py-4 shrink-0" style={{ borderRight: '1px solid rgba(240,171,252,0.09)', background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <p className="text-[11px] text-[#71717a] font-semibold tracking-widest px-2 mb-2">
          SETTINGS
        </p>
        {SECTIONS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex items-center gap-[10px] w-full px-3 py-2 rounded-lg border-none cursor-pointer text-[13px] text-left mb-[2px] ${active === key ? 'bg-white/8 text-[#fafafa]' : 'bg-transparent text-[#71717a]'}`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </aside>

      <div className="flex-1 overflow-auto p-8">
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
      <h2 className="text-[#fafafa] text-[18px] mb-1">Performance & Usage</h2>
      <p className="text-[#71717a] text-[13px] mb-6">API usage statistics and performance metrics.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Total API Calls */}
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.10)] rounded-[10px] p-4">
          <p className="text-[#a1a1aa] text-[12px] mb-2">Total API Calls</p>
          <div className="text-[28px] font-semibold text-[#60a5fa]">{stats.totalCalls}</div>
          <p className="text-[11px] text-[#52525b] mt-2">API requests sent</p>
        </div>

        {/* Total Tokens */}
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.10)] rounded-[10px] p-4">
          <p className="text-[#a1a1aa] text-[12px] mb-2">Total Tokens Used</p>
          <div className="text-[28px] font-semibold text-[#4ade80]">{(stats.totalTokens / 1000).toFixed(1)}K</div>
          <p className="text-[11px] text-[#52525b] mt-2">Input + Output tokens</p>
        </div>

        {/* Avg Response Time */}
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.10)] rounded-[10px] p-4">
          <p className="text-[#a1a1aa] text-[12px] mb-2">Avg Response Time</p>
          <div className="text-[28px] font-semibold text-[#fbbf24]">{stats.avgTime.toFixed(0)}ms</div>
          <p className="text-[11px] text-[#52525b] mt-2">Average latency</p>
        </div>

        {/* Total Time */}
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.10)] rounded-[10px] p-4">
          <p className="text-[#a1a1aa] text-[12px] mb-2">Total API Time</p>
          <div className="text-[28px] font-semibold text-[#a78bfa]">{(stats.totalTime / 1000).toFixed(1)}s</div>
          <p className="text-[11px] text-[#52525b] mt-2">Cumulative wait time</p>
        </div>

        {/* Estimated Cost */}
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.10)] rounded-[10px] p-4">
          <p className="text-[#a1a1aa] text-[12px] mb-2">Est. Cost</p>
          <div className="text-[28px] font-semibold text-[#f87171]">${stats.estimatedCost.toFixed(3)}</div>
          <p className="text-[11px] text-[#52525b] mt-2">Rough API cost estimate</p>
        </div>

        {/* Efficiency */}
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.10)] rounded-[10px] p-4">
          <p className="text-[#a1a1aa] text-[12px] mb-2">Efficiency</p>
          <div className="text-[28px] font-semibold text-[#06b6d4]">
            {stats.totalCalls > 0 ? (stats.totalTokens / stats.totalCalls).toFixed(0) : 0}
          </div>
          <p className="text-[11px] text-[#52525b] mt-2">Avg tokens per call</p>
        </div>
      </div>

      <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.10)] rounded-[10px] p-4 mb-5">
        <h3 className="text-[#fafafa] text-[14px] mb-3">💡 Notes</h3>
        <ul className="text-[#a1a1aa] text-[12px] m-0 pl-5 leading-[1.8]">
          <li>Statistics are calculated locally on your device.</li>
          <li>Cost estimates are rough approximations based on typical token pricing.</li>
          <li>Actual API costs depend on your provider's pricing model.</li>
          <li>Response time is measured from request sent to response received.</li>
        </ul>
      </div>

      <button
        onClick={resetStats}
        className="px-5 py-2 rounded-[6px] border-none bg-[#7f1d1d] text-[#fef2f2] cursor-pointer text-[13px]"
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
      <h2 className="text-[#fafafa] text-[18px] mb-1">Keyboard Shortcuts</h2>
      <p className="text-[#71717a] text-[13px] mb-5">
        Customize keyboard shortcuts for quick actions.
      </p>
      <div className="flex flex-col gap-3">
        {Object.entries(shortcuts).map(([action, keys]) => (
          <div key={action} className="flex items-center gap-3 px-3 py-[10px] bg-[#111113] rounded-lg border border-[rgba(240,171,252,0.10)]">
            <span className="text-[#a1a1aa] text-[13px] min-w-[150px] capitalize">
              {action.replace(/-/g, ' ')}
            </span>
            <input
              value={keys as string}
              onChange={(e) => updateShortcut(action, e.target.value)}
              placeholder="e.g. Cmd+K"
              className="flex-1 bg-[#27272a] border border-[rgba(240,171,252,0.15)] rounded-[6px] text-[#fafafa] text-[12px] px-[10px] py-[6px] outline-none"
            />
            <span className="text-[11px] text-[#52525b]">Custom</span>
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
      <h2 className="text-[#fafafa] text-[18px] mb-2">Cherry Studio Clone</h2>
      <p className="text-[#71717a] text-[13px]">Version {version} · Electron + React + TypeScript</p>
      <div className="flex items-center gap-2 mt-2 mb-6">
        <button
          onClick={checkUpdate}
          disabled={checking}
          className="px-[14px] py-[6px] rounded-[6px] border border-[rgba(240,171,252,0.15)] bg-[#27272a] text-[#a1a1aa] cursor-pointer text-[12px]"
        >
          {checking ? 'Checking…' : 'Check for Updates'}
        </button>
        {updateInfo && (
          <span className={`text-[12px] ${updateInfo.hasUpdate ? 'text-[#fbbf24]' : 'text-[#71717a]'}`}>
            {updateInfo.hasUpdate ? `Update available: v${updateInfo.latest}` : 'You are up to date'}
          </span>
        )}
      </div>
      <p className="text-[#52525b] text-[12px] mb-6">
        A from-scratch replication of Cherry Studio — an AI desktop client.
      </p>

      <h3 className="text-[#a1a1aa] text-[13px] font-semibold tracking-widest mb-[10px]">KEYBOARD SHORTCUTS</h3>
      <div className="flex flex-col gap-[6px]">
        {SHORTCUTS.map(({ keys, label }) => (
          <div key={keys} className="flex items-center gap-4">
            <kbd className="bg-[#27272a] border border-[rgba(240,171,252,0.15)] rounded-[5px] text-[#fafafa] text-[12px] min-w-[120px] px-[10px] py-[3px] text-center font-mono">
              {keys}
            </kbd>
            <span className="text-[#71717a] text-[13px]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

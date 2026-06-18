import React, { useState } from 'react'
import { ProvidersSettings } from './sections/ProvidersSettings'
import { McpSettings } from './sections/McpSettings'
import { WebSearchSettings } from './sections/WebSearchSettings'
import { GeneralSettings } from './sections/GeneralSettings'
import { BackupSettings } from './sections/BackupSettings'

const SECTIONS = [
  { key: 'general', label: 'General', icon: '🛠' },
  { key: 'providers', label: 'AI Providers', icon: '🔌' },
  { key: 'mcp', label: 'MCP Servers', icon: '🔧' },
  { key: 'web-search', label: 'Web Search', icon: '🔍' },
  { key: 'backup', label: 'Backup', icon: '💾' },
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
        {active === 'backup' && <BackupSettings />}
        {active === 'about' && <AboutSection />}
      </div>
    </div>
  )
}

function AboutSection() {
  return (
    <div>
      <h2 style={{ color: '#fafafa', fontSize: 18, marginBottom: 8 }}>Cherry Studio Clone</h2>
      <p style={{ color: '#71717a', fontSize: 13 }}>Version 0.1.0 · Electron + React + TypeScript</p>
      <p style={{ color: '#52525b', fontSize: 12, marginTop: 8 }}>
        A from-scratch replication of Cherry Studio — an AI desktop client.
      </p>
    </div>
  )
}

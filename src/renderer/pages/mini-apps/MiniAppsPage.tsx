import React, { useState, useEffect } from 'react'
import { IpcChannel } from '@shared/IpcChannel'

type MiniApp = {
  id: string
  name: string
  url: string
  icon: string
  description: string
  isCustom?: boolean
}

const BUILTIN_APPS: MiniApp[] = [
  { id: 'chatgpt',     name: 'ChatGPT',      url: 'https://chat.openai.com',         icon: '🤖', description: 'OpenAI ChatGPT' },
  { id: 'claude',      name: 'Claude',       url: 'https://claude.ai',               icon: '✨', description: 'Anthropic Claude' },
  { id: 'gemini',      name: 'Gemini',       url: 'https://gemini.google.com',        icon: '💎', description: 'Google Gemini' },
  { id: 'perplexity',  name: 'Perplexity',   url: 'https://www.perplexity.ai',       icon: '🔍', description: 'AI-powered search' },
  { id: 'poe',         name: 'Poe',          url: 'https://poe.com',                 icon: '🦋', description: 'Quora Poe' },
  { id: 'copilot',     name: 'Copilot',      url: 'https://copilot.microsoft.com',   icon: '🪟', description: 'Microsoft Copilot' },
  { id: 'mistral',     name: 'Le Chat',      url: 'https://chat.mistral.ai',         icon: '🌊', description: 'Mistral AI chat' },
  { id: 'cohere',      name: 'Cohere',       url: 'https://coral.cohere.com',        icon: '🐚', description: 'Cohere Coral' },
  { id: 'huggingchat', name: 'HuggingChat',  url: 'https://huggingface.co/chat',     icon: '🤗', description: 'Hugging Face chat' },
  { id: 'you',         name: 'You.com',      url: 'https://you.com',                 icon: '🎯', description: 'AI search engine' },
  { id: 'groq',        name: 'Groq',         url: 'https://groq.com',                icon: '⚡', description: 'Fast LLM inference' },
  { id: 'together',    name: 'Together AI',  url: 'https://api.together.ai/playground', icon: '🤝', description: 'Together AI playground' },
]

const STORAGE_KEY = 'cherry-clone:mini-apps:custom'

function loadCustomApps(): MiniApp[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveCustomApps(apps: MiniApp[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
}

export function MiniAppsPage(): React.ReactElement {
  const [customApps, setCustomApps] = useState<MiniApp[]>(loadCustomApps)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newIcon, setNewIcon] = useState('🔗')
  const [filter, setFilter] = useState('')

  useEffect(() => { saveCustomApps(customApps) }, [customApps])

  const allApps = [...BUILTIN_APPS, ...customApps]
  const filtered = filter.trim()
    ? allApps.filter((a) => a.name.toLowerCase().includes(filter.toLowerCase()) || a.description.toLowerCase().includes(filter.toLowerCase()))
    : allApps

  const openApp = (app: MiniApp) => {
    window.api.invoke(IpcChannel.MINI_APPS_OPEN, { url: app.url, title: app.name })
  }

  const handleAddCustom = () => {
    if (!newName.trim() || !newUrl.trim()) return
    const url = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`
    const app: MiniApp = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      url,
      icon: newIcon,
      description: url,
      isCustom: true
    }
    setCustomApps((prev) => [...prev, app])
    setNewName('')
    setNewUrl('')
    setNewIcon('🔗')
    setShowAdd(false)
  }

  const handleDeleteCustom = (id: string) => {
    setCustomApps((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#09090b', color: '#fafafa' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, flex: 'none' }}>🧩 Mini Apps</h2>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter apps…"
          style={inputStyle}
        />
        <button onClick={() => setShowAdd(true)} style={btnPrimaryStyle}>+ Add</button>
      </div>

      {/* Add custom app form */}
      {showAdd && (
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #27272a', background: '#18181b', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
          <div>
            <label style={labelStyle}>Icon</label>
            <input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              style={{ ...inputStyle, width: 52, textAlign: 'center', fontSize: 20, padding: '4px 6px' }}
              maxLength={2}
            />
          </div>
          <div style={{ flex: '0 0 160px' }}>
            <label style={labelStyle}>Name</label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="My App"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>URL</label>
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustom(); if (e.key === 'Escape') setShowAdd(false) }}
              style={inputStyle}
            />
          </div>
          <button onClick={handleAddCustom} style={btnPrimaryStyle}>Add</button>
          <button onClick={() => setShowAdd(false)} style={btnSecondaryStyle}>Cancel</button>
        </div>
      )}

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60, color: '#52525b' }}>
            <p style={{ fontSize: 14 }}>No apps found for "{filter}"</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {filtered.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onOpen={() => openApp(app)}
                onDelete={app.isCustom ? () => handleDeleteCustom(app.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid #18181b', padding: '6px 24px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#52525b' }}>{allApps.length} apps · {customApps.length} custom</span>
      </div>
    </div>
  )
}

function AppCard({
  app, onOpen, onDelete
}: {
  app: MiniApp
  onOpen: () => void
  onDelete?: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12,
        border: `1px solid ${hovered ? '#3f3f46' : '#27272a'}`,
        background: hovered ? '#18181b' : '#111113',
        padding: '16px 14px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.12s',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      <span style={{ fontSize: 36, lineHeight: 1 }}>{app.icon}</span>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fafafa', textAlign: 'center' }}>{app.name}</p>
      <p style={{ margin: 0, fontSize: 10, color: '#52525b', textAlign: 'center', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {app.description}
      </p>
      {app.isCustom && hovered && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{
            position: 'absolute', top: 6, right: 6,
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 4,
            color: '#71717a', cursor: 'pointer', fontSize: 10, padding: '2px 5px'
          }}
          title="Remove"
        >
          ✕
        </button>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#71717a', marginBottom: 4
}

const inputStyle: React.CSSProperties = {
  background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6,
  color: '#fafafa', fontSize: 13, outline: 'none', padding: '6px 10px',
  width: '100%', boxSizing: 'border-box'
}

const btnPrimaryStyle: React.CSSProperties = {
  background: '#2563eb', border: 'none', borderRadius: 6, color: 'white',
  cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '6px 14px', whiteSpace: 'nowrap', flexShrink: 0
}

const btnSecondaryStyle: React.CSSProperties = {
  background: '#27272a', border: 'none', borderRadius: 6, color: '#a1a1aa',
  cursor: 'pointer', fontSize: 12, padding: '6px 14px', whiteSpace: 'nowrap', flexShrink: 0
}

import React, { useEffect, useState } from 'react'
import { IpcChannel } from '@shared/IpcChannel'

type Provider = 'duckduckgo' | 'tavily' | 'searxng'

interface WebSearchConfig {
  provider: Provider
  tavilyApiKey?: string
  searxngUrl?: string
}

export function WebSearchSettings(): React.ReactElement {
  const [config, setConfig] = useState<WebSearchConfig>({ provider: 'duckduckgo' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.invoke(IpcChannel.WEB_SEARCH_CONFIG_GET).then((c: WebSearchConfig) => {
      if (c) setConfig(c)
    })
  }, [])

  async function save() {
    await window.api.invoke(IpcChannel.WEB_SEARCH_CONFIG_SET, config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const input: React.CSSProperties = {
    background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6,
    color: '#fafafa', padding: '6px 10px', fontSize: 13, width: '100%', boxSizing: 'border-box'
  }
  const label: React.CSSProperties = { fontSize: 12, color: '#a1a1aa', marginBottom: 4, display: 'block' }

  return (
    <div>
      <h2 style={{ color: '#fafafa', fontSize: 18, marginBottom: 4 }}>Web Search</h2>
      <p style={{ color: '#71717a', fontSize: 13, marginBottom: 24 }}>
        Configure the search provider used when AI queries the web.
      </p>

      <div style={{ marginBottom: 20 }}>
        <label style={label}>Provider</label>
        <select
          value={config.provider}
          onChange={(e) => setConfig({ ...config, provider: e.target.value as Provider })}
          style={{ ...input, cursor: 'pointer' }}
        >
          <option value="duckduckgo">DuckDuckGo (no key required)</option>
          <option value="tavily">Tavily (API key required)</option>
          <option value="searxng">SearXNG (self-hosted)</option>
        </select>
      </div>

      {config.provider === 'tavily' && (
        <div style={{ marginBottom: 20 }}>
          <label style={label}>Tavily API Key</label>
          <input
            type="password"
            value={config.tavilyApiKey ?? ''}
            onChange={(e) => setConfig({ ...config, tavilyApiKey: e.target.value })}
            placeholder="tvly-..."
            style={input}
          />
          <p style={{ fontSize: 11, color: '#52525b', marginTop: 4 }}>
            Get a key at tavily.com/dashboard
          </p>
        </div>
      )}

      {config.provider === 'searxng' && (
        <div style={{ marginBottom: 20 }}>
          <label style={label}>SearXNG Base URL</label>
          <input
            type="text"
            value={config.searxngUrl ?? ''}
            onChange={(e) => setConfig({ ...config, searxngUrl: e.target.value })}
            placeholder="http://localhost:8080"
            style={input}
          />
          <p style={{ fontSize: 11, color: '#52525b', marginTop: 4 }}>
            Your self-hosted SearXNG instance with JSON format enabled.
          </p>
        </div>
      )}

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

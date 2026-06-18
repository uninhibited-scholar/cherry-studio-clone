import React, { useState, useEffect, useCallback } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import { useNavigate } from 'react-router-dom'

type HistoryEntry = {
  topicId: string
  topicTitle: string
  assistantId: string
  assistantName: string
  assistantEmoji: string
  preview: string
  updatedAt: number
}

type HistorySearchResult = HistoryEntry & { matchedContent: string }

export function HistoryPage(): React.ReactElement {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<HistorySearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const loadAll = useCallback(async () => {
    setLoading(true)
    const list = await window.api.invoke(IpcChannel.HISTORY_LIST_ALL) as HistoryEntry[]
    setEntries(list)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleSearch = async () => {
    if (!query.trim()) { setResults(null); return }
    setLoading(true)
    const found = await window.api.invoke(IpcChannel.HISTORY_SEARCH, query) as HistorySearchResult[]
    setResults(found)
    setLoading(false)
  }

  const displayed = results ?? entries
  const formatDate = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - ts) / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'short' })
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    const before = text.slice(Math.max(0, idx - 30), idx)
    const match = text.slice(idx, idx + q.length)
    const after = text.slice(idx + q.length, idx + q.length + 80)
    return `…${before}<mark style="background:#854d0e;color:#fef3c7;border-radius:2px;padding:0 2px">${match}</mark>${after}…`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#09090b', color: '#fafafa' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #27272a', flexShrink: 0 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>🕐 Conversation History</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setResults(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            placeholder="Search across all conversations…"
            style={inputStyle}
          />
          <button onClick={handleSearch} style={btnStyle}>Search</button>
          {results !== null && (
            <button onClick={() => { setResults(null); setQuery('') }} style={btnStyle}>✕</button>
          )}
        </div>
        {results !== null && (
          <p style={{ fontSize: 11, color: '#71717a', marginTop: 6 }}>
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </p>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#52525b' }}>Loading…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#52525b' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🕐</p>
            <p style={{ fontSize: 14, color: '#71717a' }}>
              {results !== null ? `No results for "${query}"` : 'No conversations yet'}
            </p>
          </div>
        ) : (
          displayed.map((entry) => (
            <div
              key={entry.topicId}
              onClick={() => navigate('/chat')}
              style={{
                padding: '14px 24px', borderBottom: '1px solid #18181b',
                cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#111113')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.4 }}>{entry.assistantEmoji}</span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.topicTitle}
                  </span>
                  <span style={{ fontSize: 10, color: '#3f3f46', flexShrink: 0 }}>{formatDate(entry.updatedAt)}</span>
                </div>
                <p style={{ margin: '0 0 2px', fontSize: 11, color: '#71717a' }}>{entry.assistantName}</p>
                {'matchedContent' in entry && (entry as HistorySearchResult).matchedContent ? (
                  <p
                    style={{ margin: 0, fontSize: 11, color: '#52525b', lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{ __html: highlight((entry as HistorySearchResult).matchedContent, query) }}
                  />
                ) : (
                  <p style={{ margin: 0, fontSize: 11, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.preview}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ borderTop: '1px solid #18181b', padding: '6px 24px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#52525b' }}>{entries.length} conversation{entries.length !== 1 ? 's' : ''} total</span>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1, background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6,
  color: '#fafafa', fontSize: 13, outline: 'none', padding: '6px 10px'
}

const btnStyle: React.CSSProperties = {
  background: '#27272a', border: 'none', borderRadius: 6, color: '#a1a1aa',
  cursor: 'pointer', fontSize: 12, padding: '6px 14px', whiteSpace: 'nowrap'
}

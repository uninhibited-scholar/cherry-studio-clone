import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { IpcChannel } from '@shared/IpcChannel'

type SearchResult = {
  messageId: string
  content: string
  role: string
  topicId: string
  topicTitle: string
  assistantName: string
  createdAt: number
}

function highlightMatch(text: string, query: string): React.ReactElement {
  if (!query.trim()) return <span>{text}</span>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-[#2563eb] text-white rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  )
}

function snippet(content: string, query: string, maxLen = 200): string {
  const idx = content.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return content.slice(0, maxLen)
  const start = Math.max(0, idx - 60)
  const end = Math.min(content.length, idx + query.length + 140)
  return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '')
}

export function SearchPage(): React.ReactElement {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const navigate = useNavigate()

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    try {
      const res = await window.api.invoke(IpcChannel.MESSAGES_SEARCH_GLOBAL, { query: q, limit: 40 }) as SearchResult[]
      setResults(res)
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Group results by topicId
  const grouped: Record<string, { topicTitle: string; assistantName: string; messages: SearchResult[] }> = {}
  for (const r of results) {
    if (!grouped[r.topicId]) {
      grouped[r.topicId] = { topicTitle: r.topicTitle, assistantName: r.assistantName, messages: [] }
    }
    grouped[r.topicId].messages.push(r)
  }

  return (
    <div className="flex flex-col h-full bg-[rgba(10,0,20,0.60)] overflow-hidden">
      {/* Search bar */}
      <div className="px-6 py-5 border-b border-b-[rgba(240,171,252,0.08)] shrink-0">
        <h1 className="text-[#fafafa] text-[18px] font-semibold mb-4">Global Message Search</h1>
        <div className="flex gap-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') doSearch(query) }}
            placeholder="Search across all messages…"
            className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-lg text-[#fafafa] px-4 py-2.5 text-sm outline-none focus:border-[#2563eb]"
          />
          <button
            onClick={() => doSearch(query)}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-[#2563eb] text-white text-sm font-medium cursor-pointer border-0 disabled:opacity-60"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {!searched && !loading && (
          <p className="text-[#52525b] text-sm text-center mt-16">Type a query and press Enter or Search</p>
        )}

        {searched && results.length === 0 && !loading && (
          <p className="text-[#52525b] text-sm text-center mt-16">No messages found for "{query}"</p>
        )}

        {Object.entries(grouped).map(([topicId, group]) => (
          <div key={topicId} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#60a5fa] text-xs font-semibold">{group.assistantName}</span>
              <span className="text-[#52525b] text-xs">›</span>
              <span className="text-[#a1a1aa] text-xs">{group.topicTitle}</span>
              <span className="ml-auto text-[#3f3f46] text-xs">{group.messages.length} result{group.messages.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col gap-2">
              {group.messages.map((msg) => (
                <button
                  key={msg.messageId}
                  onClick={() => navigate(`/chat?topicId=${topicId}&messageId=${msg.messageId}`)}
                  className="text-left bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.10)] rounded-lg px-4 py-3 cursor-pointer hover:border-[#3f3f46] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${msg.role === 'user' ? 'bg-[#1d3461] text-[#60a5fa]' : 'bg-[#1a1a2e] text-[#a78bfa]'}`}>
                      {msg.role === 'user' ? 'You' : 'AI'}
                    </span>
                    <span className="text-[#3f3f46] text-[11px]">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[#a1a1aa] text-xs leading-relaxed line-clamp-3">
                    {highlightMatch(snippet(msg.content, query), query)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

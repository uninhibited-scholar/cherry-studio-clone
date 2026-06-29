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

type SearchFilters = {
  query: string
  dateFrom: string
  dateTo: string
  minLength: number
  maxLength: number
  starred: boolean | null
}

export function HistoryPage(): React.ReactElement {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    dateFrom: '',
    dateTo: '',
    minLength: 0,
    maxLength: 10000,
    starred: null
  })
  const [results, setResults] = useState<HistorySearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()

  const loadAll = useCallback(async () => {
    setLoading(true)
    const list = await window.api.invoke(IpcChannel.HISTORY_LIST_ALL) as HistoryEntry[]
    setEntries(list)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleSearch = async () => {
    if (!filters.query.trim() && !filters.dateFrom && !filters.dateTo) { setResults(null); return }
    setLoading(true)
    let found = await window.api.invoke(IpcChannel.HISTORY_SEARCH, filters.query) as HistorySearchResult[]

    // Apply filters
    found = found.filter(entry => {
      // Date range
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom).getTime()
        if (entry.updatedAt < from) return false
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo).getTime() + 86400000 // end of day
        if (entry.updatedAt > to) return false
      }

      // Length
      const length = entry.matchedContent.length
      if (length < filters.minLength || length > filters.maxLength) return false

      return true
    })

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
    <div className="flex flex-col h-full bg-[#09090b] text-[#fafafa]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#27272a] shrink-0">
        <h2 className="m-0 mb-3 text-[15px] font-bold">🕐 Conversation History</h2>
        <div className="flex gap-2 mb-3">
          <input
            value={filters.query}
            onChange={(e) => { setFilters({ ...filters, query: e.target.value }); if (!e.target.value) setResults(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            placeholder="Search across all conversations…"
            className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] flex-1"
          />
          <button onClick={handleSearch} className="bg-[#27272a] border-none rounded-md text-[#a1a1aa] cursor-pointer text-[12px] px-[14px] py-[6px] whitespace-nowrap">Search</button>
          <button onClick={() => setShowFilters((v) => !v)} title="Advanced filters" className="bg-[#27272a] border-none rounded-md text-[#a1a1aa] cursor-pointer text-[12px] px-[14px] py-[6px] whitespace-nowrap">⚙️ {showFilters ? 'Hide' : 'Show'}</button>
          {results !== null && (
            <button onClick={() => { setResults(null); setFilters({ ...filters, query: '' }) }} className="bg-[#27272a] border-none rounded-md text-[#a1a1aa] cursor-pointer text-[12px] px-[14px] py-[6px] whitespace-nowrap">✕</button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3 mb-3">
            <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {/* Date From */}
              <div>
                <label className="text-[11px] text-[#a1a1aa] block mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="text-[11px] text-[#a1a1aa] block mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full"
                />
              </div>

              {/* Min Length */}
              <div>
                <label className="text-[11px] text-[#a1a1aa] block mb-1">Min Length</label>
                <input
                  type="number"
                  value={filters.minLength}
                  onChange={(e) => setFilters({ ...filters, minLength: Number(e.target.value) })}
                  className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full"
                  placeholder="0"
                />
              </div>

              {/* Max Length */}
              <div>
                <label className="text-[11px] text-[#a1a1aa] block mb-1">Max Length</label>
                <input
                  type="number"
                  value={filters.maxLength}
                  onChange={(e) => setFilters({ ...filters, maxLength: Number(e.target.value) })}
                  className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full"
                  placeholder="10000"
                />
              </div>
            </div>
            <button
              onClick={() => setFilters({ query: '', dateFrom: '', dateTo: '', minLength: 0, maxLength: 10000, starred: null })}
              className="text-[12px] px-2 py-1 bg-transparent border border-[#3f3f46] rounded text-[#a1a1aa] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {results !== null && (
          <p className="text-[11px] text-[#71717a] mt-[6px]">
            {results.length} result{results.length !== 1 ? 's' : ''} {filters.query ? `for "${filters.query}"` : 'with applied filters'}
          </p>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-12 text-center text-[#52525b]">Loading…</div>
        ) : displayed.length === 0 ? (
          <div className="p-12 text-center text-[#52525b]">
            <p className="text-[36px] mb-3">🕐</p>
            <p className="text-[14px] text-[#71717a]">
              {results !== null ? `No results for "${filters.query}"` : 'No conversations yet'}
            </p>
          </div>
        ) : (
          displayed.map((entry) => (
            <div
              key={entry.topicId}
              onClick={() => navigate('/chat')}
              className="px-6 py-[14px] border-b border-[#18181b] cursor-pointer flex gap-[14px] items-start"
              onMouseEnter={(e) => (e.currentTarget.style.background = '#111113')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="text-[22px] shrink-0 leading-[1.4]">{entry.assistantEmoji}</span>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2 mb-[3px]">
                  <span className="text-[13px] font-semibold text-[#fafafa] overflow-hidden text-ellipsis whitespace-nowrap">
                    {entry.topicTitle}
                  </span>
                  <span className="text-[10px] text-[#3f3f46] shrink-0">{formatDate(entry.updatedAt)}</span>
                </div>
                <p className="m-0 mb-[2px] text-[11px] text-[#71717a]">{entry.assistantName}</p>
                {'matchedContent' in entry && (entry as HistorySearchResult).matchedContent ? (
                  <p
                    className="m-0 text-[11px] text-[#52525b] leading-[1.5]"
                    dangerouslySetInnerHTML={{ __html: highlight((entry as HistorySearchResult).matchedContent, filters.query) }}
                  />
                ) : (
                  <p className="m-0 text-[11px] text-[#52525b] overflow-hidden text-ellipsis whitespace-nowrap">
                    {entry.preview}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-[#18181b] px-6 py-[6px] shrink-0">
        <span className="text-[11px] text-[#52525b]">{entries.length} conversation{entries.length !== 1 ? 's' : ''} total</span>
      </div>
    </div>
  )
}

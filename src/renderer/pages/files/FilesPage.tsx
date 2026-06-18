import React, { useEffect, useState } from 'react'
import { IpcChannel } from '@shared/IpcChannel'

interface KnowledgeBase {
  id: string
  name: string
  description?: string
  createdAt: number
}

interface KnowledgeDocument {
  id: string
  knowledgeBaseId: string
  title: string
  content: string
  createdAt: number
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function truncate(text: string, max = 120) {
  return text.length <= max ? text : text.slice(0, max) + '…'
}

export function FilesPage(): React.ReactElement {
  const [bases, setBases] = useState<KnowledgeBase[]>([])
  const [docs, setDocs] = useState<KnowledgeDocument[]>([])
  const [selectedBase, setSelectedBase] = useState<string | 'all'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    window.api.invoke(IpcChannel.KNOWLEDGE_LIST).then((b: KnowledgeBase[]) => setBases(b ?? []))
  }, [])

  useEffect(() => {
    if (selectedBase === 'all') {
      Promise.all(
        bases.map((b) => window.api.invoke(IpcChannel.KNOWLEDGE_LIST, b.id) as Promise<KnowledgeDocument[]>)
      ).then((results) => setDocs(results.flat()))
    } else {
      window.api
        .invoke(IpcChannel.KNOWLEDGE_LIST, selectedBase)
        .then((d: KnowledgeDocument[]) => setDocs(d ?? []))
    }
  }, [bases, selectedBase])

  const filtered = docs.filter(
    (d) =>
      !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.content.toLowerCase().includes(search.toLowerCase())
  )

  const input: React.CSSProperties = {
    background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8,
    color: '#fafafa', padding: '7px 12px', fontSize: 13, outline: 'none'
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#09090b', color: '#fafafa' }}>
      {/* Sidebar: knowledge bases */}
      <aside
        style={{
          width: 200, borderRight: '1px solid #27272a', padding: '16px 8px',
          display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0, overflowY: 'auto'
        }}
      >
        <p style={{ fontSize: 11, color: '#71717a', fontWeight: 600, letterSpacing: 1, padding: '0 8px', marginBottom: 8 }}>
          KNOWLEDGE BASES
        </p>
        <button
          onClick={() => setSelectedBase('all')}
          style={{
            textAlign: 'left', padding: '8px 12px', borderRadius: 6, border: 'none',
            background: selectedBase === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: selectedBase === 'all' ? '#fafafa' : '#71717a', cursor: 'pointer', fontSize: 13
          }}
        >
          📁 All files
        </button>
        {bases.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBase(b.id)}
            style={{
              textAlign: 'left', padding: '8px 12px', borderRadius: 6, border: 'none',
              background: selectedBase === b.id ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: selectedBase === b.id ? '#fafafa' : '#71717a', cursor: 'pointer', fontSize: 13
            }}
          >
            📚 {b.name}
          </button>
        ))}
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#a1a1aa', fontSize: 14, fontWeight: 500 }}>
            {filtered.length} document{filtered.length !== 1 ? 's' : ''}
          </span>
          <input
            style={{ ...input, marginLeft: 'auto', width: 240 }}
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Document list */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {filtered.length === 0 ? (
            <div style={{ color: '#52525b', textAlign: 'center', paddingTop: 80, fontSize: 14 }}>
              {bases.length === 0 ? 'No knowledge bases yet. Create one in the Knowledge page.' : 'No documents found.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((doc) => {
                const base = bases.find((b) => b.id === doc.knowledgeBaseId)
                return (
                  <div
                    key={doc.id}
                    style={{
                      background: '#18181b', border: '1px solid #27272a', borderRadius: 10,
                      padding: '14px 16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#fafafa' }}>📄 {doc.title}</span>
                      {base && (
                        <span style={{ fontSize: 11, color: '#71717a', background: '#27272a', borderRadius: 4, padding: '1px 6px' }}>
                          {base.name}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: '#52525b', marginLeft: 'auto' }}>{formatDate(doc.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#71717a', margin: 0, lineHeight: 1.5 }}>
                      {truncate(doc.content)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

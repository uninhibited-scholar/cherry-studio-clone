import React, { useState, useEffect, useCallback } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { KnowledgeBase, KnowledgeDocument } from '@shared/data/types/knowledge'

// ─── KnowledgePage ───────────────────────────────────────────────────────────

export function KnowledgePage(): React.ReactElement {
  const [bases, setBases] = useState<KnowledgeBase[]>([])
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<KnowledgeDocument[] | null>(null)
  const [showAddBase, setShowAddBase] = useState(false)
  const [showAddDoc, setShowAddDoc] = useState(false)
  const [newBaseName, setNewBaseName] = useState('')
  const [newBaseDesc, setNewBaseDesc] = useState('')
  const [addDocName, setAddDocName] = useState('')
  const [addDocContent, setAddDocContent] = useState('')
  const [addDocType, setAddDocType] = useState<'text' | 'markdown'>('text')

  const selectedBase = bases.find((b) => b.id === selectedBaseId) ?? null

  const refreshBases = useCallback(async () => {
    const list = await window.api.invoke(IpcChannel.KNOWLEDGE_LIST) as KnowledgeBase[]
    setBases(list)
  }, [])

  const refreshDocs = useCallback(async (baseId: string) => {
    const docs = await window.api.invoke(IpcChannel.KNOWLEDGE_LIST, baseId) as KnowledgeDocument[]
    setDocuments(docs)
    setSearchResults(null)
    setSearchQuery('')
  }, [])

  useEffect(() => { refreshBases() }, [refreshBases])

  useEffect(() => {
    if (selectedBaseId) refreshDocs(selectedBaseId)
    else setDocuments([])
  }, [selectedBaseId, refreshDocs])

  const handleCreateBase = async () => {
    if (!newBaseName.trim()) return
    const base = await window.api.invoke(IpcChannel.KNOWLEDGE_CREATE, {
      name: newBaseName.trim(),
      description: newBaseDesc.trim()
    }) as KnowledgeBase
    setBases((prev) => [base, ...prev])
    setSelectedBaseId(base.id)
    setNewBaseName('')
    setNewBaseDesc('')
    setShowAddBase(false)
  }

  const handleDeleteBase = async (id: string) => {
    await window.api.invoke(IpcChannel.KNOWLEDGE_DELETE, { id, type: 'base' })
    setBases((prev) => prev.filter((b) => b.id !== id))
    if (selectedBaseId === id) setSelectedBaseId(null)
  }

  const handleAddDoc = async () => {
    if (!selectedBaseId || !addDocName.trim() || !addDocContent.trim()) return
    const doc = await window.api.invoke(IpcChannel.KNOWLEDGE_CREATE, {
      knowledgeBaseId: selectedBaseId,
      name: addDocName.trim(),
      content: addDocContent.trim(),
      type: addDocType
    }) as KnowledgeDocument
    setDocuments((prev) => [doc, ...prev])
    setBases((prev) => prev.map((b) => b.id === selectedBaseId ? { ...b, documentCount: b.documentCount + 1 } : b))
    setAddDocName('')
    setAddDocContent('')
    setAddDocType('text')
    setShowAddDoc(false)
  }

  const handleDeleteDoc = async (id: string) => {
    await window.api.invoke(IpcChannel.KNOWLEDGE_DELETE, { id, type: 'document' })
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    setBases((prev) => prev.map((b) => b.id === selectedBaseId ? { ...b, documentCount: Math.max(0, b.documentCount - 1) } : b))
    if (searchResults) setSearchResults((prev) => prev?.filter((d) => d.id !== id) ?? null)
  }

  const handleSearch = async () => {
    if (!selectedBaseId || !searchQuery.trim()) { setSearchResults(null); return }
    const results = await window.api.invoke(IpcChannel.KNOWLEDGE_SEARCH, {
      knowledgeBaseId: selectedBaseId,
      query: searchQuery,
      limit: 10
    }) as KnowledgeDocument[]
    setSearchResults(results)
  }

  const displayedDocs = searchResults ?? documents
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div style={{ display: 'flex', height: '100%', background: '#09090b', color: '#fafafa' }}>
      {/* ── Base list panel ── */}
      <aside style={{ width: 240, borderRight: '1px solid #27272a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #27272a' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Knowledge Bases</span>
          <button
            onClick={() => setShowAddBase(true)}
            style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px' }}
            title="New knowledge base"
          >
            +
          </button>
        </div>

        {showAddBase && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #27272a', background: '#18181b' }}>
            <input
              autoFocus
              value={newBaseName}
              onChange={(e) => setNewBaseName(e.target.value)}
              placeholder="Base name"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateBase(); if (e.key === 'Escape') setShowAddBase(false) }}
              style={inputStyle}
            />
            <input
              value={newBaseDesc}
              onChange={(e) => setNewBaseDesc(e.target.value)}
              placeholder="Description (optional)"
              style={{ ...inputStyle, marginTop: 6 }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={handleCreateBase} style={btnPrimaryStyle}>Create</button>
              <button onClick={() => { setShowAddBase(false); setNewBaseName(''); setNewBaseDesc('') }} style={btnSecondaryStyle}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {bases.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#52525b' }}>
              <p style={{ fontSize: 13 }}>No knowledge bases yet</p>
              <button onClick={() => setShowAddBase(true)} style={{ marginTop: 12, ...btnPrimaryStyle }}>+ New Base</button>
            </div>
          ) : (
            bases.map((base) => (
              <BaseListItem
                key={base.id}
                base={base}
                isSelected={base.id === selectedBaseId}
                onSelect={() => setSelectedBaseId(base.id)}
                onDelete={() => handleDeleteBase(base.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Right panel ── */}
      {selectedBase ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #27272a', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{selectedBase.name}</h2>
                {selectedBase.description && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#71717a' }}>{selectedBase.description}</p>
                )}
              </div>
              <button onClick={() => setShowAddDoc(true)} style={btnPrimaryStyle}>+ Add Document</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResults(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                placeholder="Search documents…"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={handleSearch} style={btnSecondaryStyle}>Search</button>
              {searchResults !== null && (
                <button onClick={() => { setSearchResults(null); setSearchQuery('') }} style={btnSecondaryStyle}>✕</button>
              )}
            </div>
            {searchResults !== null && (
              <p style={{ margin: '6px 0 0', fontSize: 11, color: '#71717a' }}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            )}
          </div>

          {showAddDoc && (
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #27272a', background: '#18181b', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  autoFocus
                  value={addDocName}
                  onChange={(e) => setAddDocName(e.target.value)}
                  placeholder="Document name"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <select
                  value={addDocType}
                  onChange={(e) => setAddDocType(e.target.value as 'text' | 'markdown')}
                  style={{ ...inputStyle, width: 120 }}
                >
                  <option value="text">Plain text</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>
              <textarea
                value={addDocContent}
                onChange={(e) => setAddDocContent(e.target.value)}
                placeholder="Paste document content here…"
                rows={6}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'ui-monospace, monospace' }}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button onClick={handleAddDoc} style={btnPrimaryStyle}>Add</button>
                <button onClick={() => { setShowAddDoc(false); setAddDocName(''); setAddDocContent(''); setAddDocType('text') }} style={btnSecondaryStyle}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {displayedDocs.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#52525b' }}>
                <p style={{ fontSize: 13 }}>
                  {searchResults !== null ? 'No documents match your search.' : 'No documents yet. Click "+ Add Document" to get started.'}
                </p>
              </div>
            ) : (
              displayedDocs.map((doc) => (
                <DocCard key={doc.id} doc={doc} onDelete={handleDeleteDoc} formatDate={formatDate} />
              ))
            )}
          </div>

          <div style={{ borderTop: '1px solid #18181b', padding: '6px 24px', flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: '#52525b' }}>
              {selectedBase.documentCount} document{selectedBase.documentCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 48 }}>📚</span>
          <p style={{ fontSize: 14, color: '#71717a' }}>Select a knowledge base or create a new one</p>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BaseListItem({
  base, isSelected, onSelect, onDelete
}: {
  base: KnowledgeBase
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 16px',
        borderBottom: '1px solid #18181b',
        cursor: 'pointer',
        background: isSelected ? 'rgba(255,255,255,0.06)' : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8
      }}
    >
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{ fontSize: 13, color: '#fafafa', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {base.name}
        </p>
        {base.description && (
          <p style={{ fontSize: 11, color: '#52525b', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {base.description}
          </p>
        )}
        <p style={{ fontSize: 10, color: '#3f3f46', margin: '2px 0 0' }}>{base.documentCount} docs</p>
      </div>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 12, padding: '2px 4px', flexShrink: 0 }}
          title="Delete base"
        >
          ✕
        </button>
      )}
    </div>
  )
}

function DocCard({
  doc, onDelete, formatDate
}: {
  doc: KnowledgeDocument
  onDelete: (id: string) => void
  formatDate: (ts: number) => string
}) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const preview = doc.content.slice(0, 200)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        margin: '6px 16px',
        padding: '12px 16px',
        borderRadius: 8,
        background: hovered ? '#18181b' : '#111113',
        border: '1px solid #27272a',
        cursor: 'pointer'
      }}
      onClick={() => setExpanded((p) => !p)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>{doc.type === 'markdown' ? '📄' : '📃'}</span>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc.name}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#52525b' }}>
            {doc.type} · {doc.content.length.toLocaleString()} chars · {formatDate(doc.createdAt)}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(doc.id) }}
          style={{ background: 'none', border: 'none', color: hovered ? '#71717a' : 'transparent', cursor: 'pointer', fontSize: 12, padding: '2px 6px', flexShrink: 0 }}
          title="Delete document"
        >
          ✕
        </button>
      </div>
      {expanded && (
        <pre style={{
          marginTop: 10, padding: 10, background: '#09090b', borderRadius: 6, fontSize: 12, color: '#a1a1aa',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 300, overflowY: 'auto',
          fontFamily: 'ui-monospace, monospace'
        }}>
          {preview}{doc.content.length > 200 ? `\n\n…(${(doc.content.length - 200).toLocaleString()} more chars)` : ''}
        </pre>
      )}
    </div>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: 6,
  color: '#fafafa',
  fontSize: 13,
  outline: 'none',
  padding: '6px 10px',
  width: '100%',
  boxSizing: 'border-box'
}

const btnPrimaryStyle: React.CSSProperties = {
  background: '#2563eb',
  border: 'none',
  borderRadius: 6,
  color: 'white',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  padding: '6px 12px',
  whiteSpace: 'nowrap'
}

const btnSecondaryStyle: React.CSSProperties = {
  background: '#27272a',
  border: 'none',
  borderRadius: 6,
  color: '#a1a1aa',
  cursor: 'pointer',
  fontSize: 12,
  padding: '6px 12px',
  whiteSpace: 'nowrap'
}

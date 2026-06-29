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

  const handleImportFile = async () => {
    if (!selectedBaseId) return
    const paths = await window.api.invoke(IpcChannel.FILE_SELECT, {
      multiple: true,
      filters: [{ name: 'Text Files', extensions: ['txt', 'md', 'markdown', 'json', 'csv', 'html', 'xml', 'yaml', 'yml', 'rst'] }]
    }) as string[]
    for (const p of paths) {
      try {
        const content = await window.api.invoke(IpcChannel.FILE_READ, p) as string
        const name = p.split('/').pop() ?? p
        const doc = await window.api.invoke(IpcChannel.KNOWLEDGE_CREATE, {
          knowledgeBaseId: selectedBaseId,
          name, content,
          type: p.endsWith('.md') || p.endsWith('.markdown') ? 'markdown' : 'text'
        }) as KnowledgeDocument
        setDocuments((prev) => [doc, ...prev])
        setBases((prev) => prev.map((b) => b.id === selectedBaseId ? { ...b, documentCount: b.documentCount + 1 } : b))
      } catch { /* skip unreadable files */ }
    }
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
    <div className="flex h-full bg-[#09090b] text-[#fafafa]">
      {/* ── Base list panel ── */}
      <aside className="w-[240px] border-r border-[#27272a] flex flex-col shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
          <span className="text-[13px] font-semibold">Knowledge Bases</span>
          <button
            onClick={() => setShowAddBase(true)}
            className="bg-transparent border-none text-[#a1a1aa] cursor-pointer text-[20px] leading-none px-[2px]"
            title="New knowledge base"
          >
            +
          </button>
        </div>

        {showAddBase && (
          <div className="px-4 py-3 border-b border-[#27272a] bg-[#18181b]">
            <input
              autoFocus
              value={newBaseName}
              onChange={(e) => setNewBaseName(e.target.value)}
              placeholder="Base name"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateBase(); if (e.key === 'Escape') setShowAddBase(false) }}
              className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full box-border"
            />
            <input
              value={newBaseDesc}
              onChange={(e) => setNewBaseDesc(e.target.value)}
              placeholder="Description (optional)"
              className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full box-border mt-[6px]"
            />
            <div className="flex gap-[6px] mt-2">
              <button onClick={handleCreateBase} className="bg-[#2563eb] border-none rounded-md text-white cursor-pointer text-[12px] font-semibold px-3 py-[6px] whitespace-nowrap">Create</button>
              <button onClick={() => { setShowAddBase(false); setNewBaseName(''); setNewBaseDesc('') }} className="bg-[#27272a] border-none rounded-md text-[#a1a1aa] cursor-pointer text-[12px] px-3 py-[6px] whitespace-nowrap">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {bases.length === 0 ? (
            <div className="p-6 text-center text-[#52525b]">
              <p className="text-[13px]">No knowledge bases yet</p>
              <button onClick={() => setShowAddBase(true)} className="mt-3 bg-[#2563eb] border-none rounded-md text-white cursor-pointer text-[12px] font-semibold px-3 py-[6px] whitespace-nowrap">+ New Base</button>
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#27272a] shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="m-0 text-[16px] font-bold">{selectedBase.name}</h2>
                {selectedBase.description && (
                  <p className="mt-1 mb-0 text-[12px] text-[#71717a]">{selectedBase.description}</p>
                )}
              </div>
              <div className="flex gap-[6px]">
                <button onClick={() => setShowAddDoc(true)} className="bg-[#2563eb] border-none rounded-md text-white cursor-pointer text-[12px] font-semibold px-3 py-[6px] whitespace-nowrap">+ Add Document</button>
                <button onClick={handleImportFile} className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#a1a1aa] cursor-pointer text-[12px] font-semibold px-3 py-[6px] whitespace-nowrap">↑ Import Files</button>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResults(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                placeholder="Search documents…"
                className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] flex-1 box-border"
              />
              <button onClick={handleSearch} className="bg-[#27272a] border-none rounded-md text-[#a1a1aa] cursor-pointer text-[12px] px-3 py-[6px] whitespace-nowrap">Search</button>
              {searchResults !== null && (
                <button onClick={() => { setSearchResults(null); setSearchQuery('') }} className="bg-[#27272a] border-none rounded-md text-[#a1a1aa] cursor-pointer text-[12px] px-3 py-[6px] whitespace-nowrap">✕</button>
              )}
            </div>
            {searchResults !== null && (
              <p className="mt-[6px] mb-0 text-[11px] text-[#71717a]">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            )}
          </div>

          {showAddDoc && (
            <div className="px-6 py-4 border-b border-[#27272a] bg-[#18181b] shrink-0">
              <div className="flex gap-2 mb-2">
                <input
                  autoFocus
                  value={addDocName}
                  onChange={(e) => setAddDocName(e.target.value)}
                  placeholder="Document name"
                  className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] flex-1 box-border"
                />
                <select
                  value={addDocType}
                  onChange={(e) => setAddDocType(e.target.value as 'text' | 'markdown')}
                  className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-[120px]"
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
                className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] resize-y font-mono w-full box-border"
              />
              <div className="flex gap-[6px] mt-2">
                <button onClick={handleAddDoc} className="bg-[#2563eb] border-none rounded-md text-white cursor-pointer text-[12px] font-semibold px-3 py-[6px] whitespace-nowrap">Add</button>
                <button onClick={() => { setShowAddDoc(false); setAddDocName(''); setAddDocContent(''); setAddDocType('text') }} className="bg-[#27272a] border-none rounded-md text-[#a1a1aa] cursor-pointer text-[12px] px-3 py-[6px] whitespace-nowrap">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-2">
            {displayedDocs.length === 0 ? (
              <div className="p-12 text-center text-[#52525b]">
                <p className="text-[13px]">
                  {searchResults !== null ? 'No documents match your search.' : 'No documents yet. Click "+ Add Document" to get started.'}
                </p>
              </div>
            ) : (
              displayedDocs.map((doc) => (
                <DocCard key={doc.id} doc={doc} onDelete={handleDeleteDoc} formatDate={formatDate} />
              ))
            )}
          </div>

          <div className="border-t border-[#18181b] px-6 py-[6px] shrink-0">
            <span className="text-[11px] text-[#52525b]">
              {selectedBase.documentCount} document{selectedBase.documentCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#52525b] flex-col gap-3">
          <span className="text-[48px]">📚</span>
          <p className="text-[14px] text-[#71717a]">Select a knowledge base or create a new one</p>
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
      className={`px-4 py-[10px] border-b border-[#18181b] cursor-pointer flex items-start gap-2 ${isSelected ? 'bg-white/[0.06]' : hovered ? 'bg-white/[0.03]' : 'bg-transparent'}`}
    >
      <div className="flex-1 overflow-hidden">
        <p className="text-[13px] text-[#fafafa] m-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium">
          {base.name}
        </p>
        {base.description && (
          <p className="text-[11px] text-[#52525b] mt-[2px] mb-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {base.description}
          </p>
        )}
        <p className="text-[10px] text-[#3f3f46] mt-[2px] mb-0">{base.documentCount} docs</p>
      </div>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="bg-transparent border-none text-[#71717a] cursor-pointer text-[12px] px-[4px] py-[2px] shrink-0"
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
      className={`mx-4 my-[6px] px-4 py-3 rounded-lg border border-[#27272a] cursor-pointer ${hovered ? 'bg-[#18181b]' : 'bg-[#111113]'}`}
      onClick={() => setExpanded((p) => !p)}
    >
      <div className="flex items-center gap-2">
        <span className="text-[14px] shrink-0">{doc.type === 'markdown' ? '📄' : '📃'}</span>
        <div className="flex-1 overflow-hidden">
          <p className="m-0 text-[13px] font-semibold text-[#fafafa] overflow-hidden text-ellipsis whitespace-nowrap">
            {doc.name}
          </p>
          <p className="mt-[2px] mb-0 text-[11px] text-[#52525b]">
            {doc.type} · {doc.content.length.toLocaleString()} chars · {formatDate(doc.createdAt)}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(doc.id) }}
          className={`bg-transparent border-none cursor-pointer text-[12px] px-[6px] py-[2px] shrink-0 ${hovered ? 'text-[#71717a]' : 'text-transparent'}`}
          title="Delete document"
        >
          ✕
        </button>
      </div>
      {expanded && (
        <pre className="mt-[10px] p-[10px] bg-[#09090b] rounded-md text-[12px] text-[#a1a1aa] whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto font-mono">
          {preview}{doc.content.length > 200 ? `\n\n…(${(doc.content.length - 200).toLocaleString()} more chars)` : ''}
        </pre>
      )}
    </div>
  )
}

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

  return (
    <div className="flex h-full bg-[#09090b] text-[#fafafa]">
      {/* Sidebar: knowledge bases */}
      <aside className="w-[200px] border-r border-[#27272a] px-2 py-4 flex flex-col gap-[2px] shrink-0 overflow-y-auto">
        <p className="text-[11px] text-[#71717a] font-semibold tracking-[1px] px-2 mb-2">
          KNOWLEDGE BASES
        </p>
        <button
          onClick={() => setSelectedBase('all')}
          className={`text-left px-3 py-2 rounded-md border-none cursor-pointer text-[13px] ${selectedBase === 'all' ? 'bg-white/[0.08] text-[#fafafa]' : 'bg-transparent text-[#71717a]'}`}
        >
          📁 All files
        </button>
        {bases.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBase(b.id)}
            className={`text-left px-3 py-2 rounded-md border-none cursor-pointer text-[13px] ${selectedBase === b.id ? 'bg-white/[0.08] text-[#fafafa]' : 'bg-transparent text-[#71717a]'}`}
          >
            📚 {b.name}
          </button>
        ))}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-5 py-3 border-b border-[#27272a] flex items-center gap-3">
          <span className="text-[#a1a1aa] text-[14px] font-medium">
            {filtered.length} document{filtered.length !== 1 ? 's' : ''}
          </span>
          <input
            className="bg-[#18181b] border border-[#3f3f46] rounded-lg text-[#fafafa] px-3 py-[7px] text-[13px] outline-none ml-auto w-[240px]"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-auto p-5">
          {filtered.length === 0 ? (
            <div className="text-[#52525b] text-center pt-[80px] text-[14px]">
              {bases.length === 0 ? 'No knowledge bases yet. Create one in the Knowledge page.' : 'No documents found.'}
            </div>
          ) : (
            <div className="flex flex-col gap-[10px]">
              {filtered.map((doc) => {
                const base = bases.find((b) => b.id === doc.knowledgeBaseId)
                return (
                  <div
                    key={doc.id}
                    className="bg-[#18181b] border border-[#27272a] rounded-[10px] px-4 py-[14px]"
                  >
                    <div className="flex items-baseline gap-[10px] mb-[6px]">
                      <span className="text-[14px] font-medium text-[#fafafa]">📄 {doc.title}</span>
                      {base && (
                        <span className="text-[11px] text-[#71717a] bg-[#27272a] rounded px-[6px] py-[1px]">
                          {base.name}
                        </span>
                      )}
                      <span className="text-[11px] text-[#52525b] ml-auto">{formatDate(doc.createdAt)}</span>
                    </div>
                    <p className="text-[12px] text-[#71717a] m-0 leading-[1.5]">
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

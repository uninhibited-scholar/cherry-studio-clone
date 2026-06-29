import React, { useState, useEffect, useCallback } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { PromptTemplate } from '@shared/data/types/library'

const BUILTIN_TEMPLATES: Omit<PromptTemplate, 'id' | 'createdAt'>[] = [
  { name: 'Expert Coder', category: 'Development', content: 'You are an expert software engineer with deep knowledge across multiple programming languages and paradigms. Provide clear, efficient, well-commented code and explain your reasoning.' },
  { name: 'Technical Writer', category: 'Writing', content: 'You are a skilled technical writer. Create clear, concise, and well-structured documentation. Use plain language, avoid jargon, and organize content with proper headings and examples.' },
  { name: 'Socratic Tutor', category: 'Education', content: 'You are a Socratic tutor. Instead of giving direct answers, guide the student to discover the answer themselves through thoughtful questions and gentle hints.' },
  { name: 'Devil\'s Advocate', category: 'Analysis', content: 'You are a devil\'s advocate. For any idea or argument presented, challenge it rigorously and constructively. Point out potential flaws, edge cases, and alternative perspectives.' },
  { name: 'Executive Summary', category: 'Business', content: 'You are a business analyst specializing in executive summaries. Distill complex information into clear, concise summaries focused on key insights, decisions needed, and recommended actions.' },
  { name: 'Creative Writing Coach', category: 'Writing', content: 'You are a creative writing coach with expertise in storytelling, character development, and narrative structure. Provide constructive feedback and creative suggestions to improve any piece of writing.' },
  { name: 'Data Analyst', category: 'Analysis', content: 'You are a data analyst. When given data or described patterns, provide statistical insights, identify trends, suggest visualizations, and explain findings in clear, actionable terms.' },
  { name: 'Translator', category: 'Language', content: 'You are a professional translator. Translate text accurately while preserving meaning, tone, and cultural nuances. When appropriate, note any translation challenges or alternatives.' },
]

export function LibraryPage(): React.ReactElement {
  const [saved, setSaved] = useState<PromptTemplate[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('General')
  const [filter, setFilter] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const load = useCallback(async () => {
    const list = await window.api.invoke(IpcChannel.LIBRARY_LIST) as PromptTemplate[]
    setSaved(list)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!newName.trim() || !newContent.trim()) return
    const t = await window.api.invoke(IpcChannel.LIBRARY_CREATE, {
      name: newName.trim(), content: newContent.trim(), category: newCategory.trim() || 'General'
    }) as PromptTemplate
    setSaved((prev) => [t, ...prev])
    setNewName(''); setNewContent(''); setNewCategory('General')
    setShowAdd(false)
  }

  const handleDelete = async (id: string) => {
    await window.api.invoke(IpcChannel.LIBRARY_DELETE, id)
    setSaved((prev) => prev.filter((t) => t.id !== id))
  }

  const copyPrompt = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  const allTemplates = [
    ...BUILTIN_TEMPLATES.map((t, i) => ({ ...t, id: `builtin-${i}`, createdAt: 0 })),
    ...saved
  ]

  const categories = [...new Set(allTemplates.map((t) => t.category))].sort()

  const filtered = filter.trim()
    ? allTemplates.filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()) || t.content.toLowerCase().includes(filter.toLowerCase()) || t.category.toLowerCase().includes(filter.toLowerCase()))
    : allTemplates

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-[#fafafa]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#27272a] shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="m-0 text-[15px] font-bold flex-none">📖 Prompt Library</h2>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter prompts…" className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full" />
          <button
            onClick={() => {
              const data = JSON.stringify(saved, null, 2)
              const blob = new Blob([data], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'prompts.json'; a.click()
              URL.revokeObjectURL(url)
            }}
            className="bg-[#27272a] border-none rounded-md text-[#a1a1aa] cursor-pointer text-[12px] font-semibold px-[14px] py-[6px] whitespace-nowrap shrink-0"
            title="Export saved prompts as JSON"
          >
            ↓ Export
          </button>
          <button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'; input.accept = '.json'
              input.onchange = async () => {
                const file = input.files?.[0]; if (!file) return
                const text = await file.text()
                const arr = JSON.parse(text) as Array<{ name: string; content: string; category?: string }>
                for (const item of arr) {
                  if (!item.name || !item.content) continue
                  const t = await window.api.invoke(IpcChannel.LIBRARY_CREATE, { name: item.name, content: item.content, category: item.category ?? 'General' }) as PromptTemplate
                  setSaved((prev) => [...prev, t])
                }
              }
              input.click()
            }}
            className="bg-[#27272a] border-none rounded-md text-[#a1a1aa] cursor-pointer text-[12px] font-semibold px-[14px] py-[6px] whitespace-nowrap shrink-0"
            title="Import prompts from JSON"
          >
            ↑ Import
          </button>
          <button onClick={() => setShowAdd(true)} className="bg-[#2563eb] border-none rounded-md text-white cursor-pointer text-[12px] font-semibold px-[14px] py-[6px] whitespace-nowrap shrink-0">+ Save Prompt</button>
        </div>
        <div className="flex gap-[6px] flex-wrap">
          <CategoryChip label="All" active={!filter} onClick={() => setFilter('')} />
          {categories.map((cat) => (
            <CategoryChip key={cat} label={cat} active={filter === cat} onClick={() => setFilter(cat)} />
          ))}
        </div>
      </div>

      {/* Add prompt form */}
      {showAdd && (
        <div className="px-6 py-4 border-b border-[#27272a] bg-[#18181b] shrink-0">
          <div className="flex gap-2 mb-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Prompt name" className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] flex-1" autoFocus />
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category" className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-[140px]" />
          </div>
          <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="System prompt content…" rows={5} className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] resize-y font-mono w-full box-border" />
          <div className="flex gap-2 mt-2">
            <button onClick={handleSave} className="bg-[#2563eb] border-none rounded-md text-white cursor-pointer text-[12px] font-semibold px-[14px] py-[6px]">Save</button>
            <button onClick={() => { setShowAdd(false); setNewName(''); setNewContent('') }} className="bg-transparent border border-[#3f3f46] rounded-md text-[#a1a1aa] cursor-pointer text-[12px] px-[10px] py-[5px]">Cancel</button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="text-center mt-[60px] text-[#52525b]">
            <p className="text-[14px] text-[#71717a]">No prompts found</p>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {filtered.map((t) => (
              <PromptCard
                key={t.id}
                template={t}
                isCopied={copied === t.id}
                isCustom={!t.id.startsWith('builtin-')}
                onCopy={() => copyPrompt(t.content, t.id)}
                onDelete={t.id.startsWith('builtin-') ? undefined : () => handleDelete(t.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#18181b] px-6 py-[6px] shrink-0">
        <span className="text-[11px] text-[#52525b]">{BUILTIN_TEMPLATES.length} built-in · {saved.length} saved</span>
      </div>
    </div>
  )
}

function PromptCard({
  template, isCopied, isCustom, onCopy, onDelete
}: {
  template: PromptTemplate
  isCopied: boolean
  isCustom: boolean
  onCopy: () => void
  onDelete?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`border border-[#27272a] rounded-[10px] p-[14px] flex flex-col gap-2 ${hovered ? 'bg-[#18181b]' : 'bg-[#111113]'}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 overflow-hidden">
          <p className="m-0 text-[13px] font-semibold">{template.name}</p>
          <span className="text-[10px] text-[#52525b] bg-[#27272a] rounded px-[6px] py-[1px] inline-block mt-[3px]">{template.category}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onCopy} className="bg-transparent border border-[#3f3f46] rounded-md text-[#a1a1aa] cursor-pointer text-[11px] px-[10px] py-[5px]">{isCopied ? '✓ Copied' : 'Copy'}</button>
          {onDelete && <button onClick={onDelete} className="bg-transparent border border-[#3f3f46] rounded-md text-[#f87171] cursor-pointer text-[11px] px-[10px] py-[5px]">Del</button>}
        </div>
      </div>
      <p
        onClick={() => setExpanded((p) => !p)}
        className="m-0 text-[12px] text-[#71717a] leading-[1.5] cursor-pointer"
        style={expanded ? undefined : { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' } as React.CSSProperties}
      >
        {template.content}
      </p>
    </div>
  )
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-[10px] py-[3px] rounded-[20px] border-none cursor-pointer text-[11px] ${active ? 'bg-[#2563eb] text-white' : 'bg-[#27272a] text-[#a1a1aa]'}`}
    >
      {label}
    </button>
  )
}

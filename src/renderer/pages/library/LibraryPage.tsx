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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#09090b', color: '#fafafa' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #27272a', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, flex: 'none' }}>📖 Prompt Library</h2>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter prompts…" style={inputStyle} />
          <button onClick={() => setShowAdd(true)} style={btnPrimaryStyle}>+ Save Prompt</button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <CategoryChip label="All" active={!filter} onClick={() => setFilter('')} />
          {categories.map((cat) => (
            <CategoryChip key={cat} label={cat} active={filter === cat} onClick={() => setFilter(cat)} />
          ))}
        </div>
      </div>

      {/* Add prompt form */}
      {showAdd && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #27272a', background: '#18181b', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Prompt name" style={{ ...inputStyle, flex: 1 }} autoFocus />
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category" style={{ ...inputStyle, width: 140 }} />
          </div>
          <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="System prompt content…" rows={5} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'ui-monospace, monospace', width: '100%', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleSave} style={btnPrimaryStyle}>Save</button>
            <button onClick={() => { setShowAdd(false); setNewName(''); setNewContent('') }} style={btnSecondaryStyle}>Cancel</button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60, color: '#52525b' }}>
            <p style={{ fontSize: 14, color: '#71717a' }}>No prompts found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
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

      <div style={{ borderTop: '1px solid #18181b', padding: '6px 24px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#52525b' }}>{BUILTIN_TEMPLATES.length} built-in · {saved.length} saved</span>
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
      style={{ background: hovered ? '#18181b' : '#111113', border: '1px solid #27272a', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{template.name}</p>
          <span style={{ fontSize: 10, color: '#52525b', background: '#27272a', borderRadius: 4, padding: '1px 6px', display: 'inline-block', marginTop: 3 }}>{template.category}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={onCopy} style={{ ...btnSecondaryStyle, fontSize: 11 }}>{isCopied ? '✓ Copied' : 'Copy'}</button>
          {onDelete && <button onClick={onDelete} style={{ ...btnSecondaryStyle, fontSize: 11, color: '#f87171' }}>Del</button>}
        </div>
      </div>
      <p
        onClick={() => setExpanded((p) => !p)}
        style={{
          margin: 0, fontSize: 12, color: '#71717a', lineHeight: 1.5, cursor: 'pointer',
          overflow: expanded ? undefined : 'hidden',
          display: expanded ? undefined : '-webkit-box',
          WebkitLineClamp: expanded ? undefined : 3,
          WebkitBoxOrient: expanded ? undefined : 'vertical'
        } as React.CSSProperties}
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
      style={{
        padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11,
        background: active ? '#2563eb' : '#27272a', color: active ? 'white' : '#a1a1aa'
      }}
    >
      {label}
    </button>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa',
  fontSize: 13, outline: 'none', padding: '6px 10px', width: '100%'
}

const btnPrimaryStyle: React.CSSProperties = {
  background: '#2563eb', border: 'none', borderRadius: 6, color: 'white',
  cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '6px 14px', whiteSpace: 'nowrap', flexShrink: 0
}

const btnSecondaryStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid #3f3f46', borderRadius: 6, color: '#a1a1aa',
  cursor: 'pointer', fontSize: 12, padding: '5px 10px'
}

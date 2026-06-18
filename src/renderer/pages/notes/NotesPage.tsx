import React, { useState, useEffect, useCallback, useRef } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import { MarkdownContent } from '../../components/MarkdownContent'
import type { Note } from '@shared/data/types/note'

export function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDirty = useRef(false)

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null
  const [preview, setPreview] = useState(false)

  // Load notes
  const refresh = useCallback(async () => {
    const list = await window.api.invoke(IpcChannel.NOTES_LIST) as Note[]
    setNotes(list)
    return list
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Populate editor when selection changes
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title)
      setContent(selectedNote.content)
      isDirty.current = false
    } else {
      setTitle('')
      setContent('')
    }
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save with 800ms debounce
  const scheduleSave = useCallback(() => {
    if (!selectedId) return
    isDirty.current = true
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await window.api.invoke(IpcChannel.NOTES_UPDATE, { id: selectedId, title, content })
      setNotes((prev) => prev.map((n) => n.id === selectedId ? { ...n, title, content, updatedAt: Date.now() } : n))
      isDirty.current = false
    }, 800)
  }, [selectedId, title, content])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    scheduleSave()
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    scheduleSave()
  }

  const createNote = async () => {
    const n = await window.api.invoke(IpcChannel.NOTES_CREATE, { title: 'Untitled' }) as Note
    setNotes((prev) => [n, ...prev])
    setSelectedId(n.id)
  }

  const deleteNote = async (id: string) => {
    await window.api.invoke(IpcChannel.NOTES_DELETE, id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div style={{ display: 'flex', height: '100%', background: '#09090b', color: '#fafafa' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, borderRight: '1px solid #27272a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #27272a' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Notes</span>
          <button
            onClick={createNote}
            style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px' }}
            title="New note"
          >
            +
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notes.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#52525b' }}>
              <p style={{ fontSize: 13 }}>No notes yet</p>
              <button onClick={createNote} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer', fontSize: 13 }}>
                + New Note
              </button>
            </div>
          ) : (
            notes.map((n) => (
              <NoteListItem
                key={n.id}
                note={n}
                isSelected={n.id === selectedId}
                onSelect={() => setSelectedId(n.id)}
                onDelete={() => deleteNote(n.id)}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </aside>

      {/* Editor */}
      {selectedId ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Title */}
          <input
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title"
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #27272a',
              outline: 'none',
              color: '#fafafa',
              fontSize: 20,
              fontWeight: 700,
              padding: '16px 24px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 24px', borderBottom: '1px solid #18181b' }}>
            <button
              onClick={() => setPreview(false)}
              style={{ background: !preview ? '#27272a' : 'none', border: 'none', color: !preview ? '#fafafa' : '#71717a', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 12 }}
            >
              Edit
            </button>
            <button
              onClick={() => setPreview(true)}
              style={{ background: preview ? '#27272a' : 'none', border: 'none', color: preview ? '#fafafa' : '#71717a', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 12 }}
            >
              Preview
            </button>
          </div>

          {/* Content */}
          {preview ? (
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px', color: '#e4e4e7', fontSize: 14 }}>
              {content ? <MarkdownContent content={content} /> : <p style={{ color: '#52525b' }}>Nothing to preview yet.</p>}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Write something… (Markdown supported)"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#e4e4e7',
                fontSize: 14,
                lineHeight: 1.8,
                padding: '16px 24px',
                resize: 'none',
                fontFamily: 'ui-monospace, "Cascadia Code", monospace',
                boxSizing: 'border-box'
              }}
            />
          )}
          {/* Status bar */}
          <div style={{ borderTop: '1px solid #18181b', padding: '6px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 11, color: '#52525b' }}>{content.length} chars · {content.split(/\s+/).filter(Boolean).length} words</span>
            <span style={{ fontSize: 11, color: '#3f3f46' }}>{selectedNote ? formatDate(selectedNote.updatedAt) : ''}</span>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 40 }}>📝</span>
          <p style={{ fontSize: 14, color: '#71717a' }}>Select a note or create a new one</p>
        </div>
      )}
    </div>
  )
}

function NoteListItem({
  note, isSelected, onSelect, onDelete, formatDate
}: {
  note: Note
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  formatDate: (ts: number) => string
}) {
  const [hovered, setHovered] = useState(false)
  const preview = note.content.slice(0, 60).replace(/\n/g, ' ') || 'Empty note'

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
          {note.title || 'Untitled'}
        </p>
        <p style={{ fontSize: 11, color: '#52525b', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {preview}
        </p>
        <p style={{ fontSize: 10, color: '#3f3f46', margin: '2px 0 0' }}>{formatDate(note.updatedAt)}</p>
      </div>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 12, padding: '2px 4px', flexShrink: 0 }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

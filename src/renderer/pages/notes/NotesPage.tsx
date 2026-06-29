import React, { useState, useEffect, useCallback, useRef } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import { MarkdownContent } from '../../components/MarkdownContent'
import type { Note } from '@shared/data/types/note'

export function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [noteSearch, setNoteSearch] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDirty = useRef(false)

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null
  const [preview, setPreview] = useState(false)

  const filteredNotes = noteSearch.trim()
    ? notes.filter((n) => n.title.toLowerCase().includes(noteSearch.toLowerCase()) || n.content.toLowerCase().includes(noteSearch.toLowerCase()))
    : notes

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
    <div className="flex h-full bg-[#09090b] text-[#fafafa]">
      {/* Sidebar */}
      <aside className="w-[240px] border-r border-[#27272a] flex flex-col shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
          <span className="text-[13px] font-semibold">Notes</span>
          <button
            onClick={createNote}
            className="bg-transparent border-none text-[#a1a1aa] cursor-pointer text-[20px] leading-none px-[2px]"
            title="New note"
          >
            +
          </button>
        </div>

        <div className="px-2 py-[6px] border-b border-[#27272a]">
          <input
            value={noteSearch}
            onChange={(e) => setNoteSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full box-border bg-[#18181b] border border-[#27272a] rounded-md text-[#fafafa] text-[12px] outline-none px-[10px] py-[5px]"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="p-6 text-center text-[#52525b]">
              <p className="text-[13px]">No notes yet</p>
              <button onClick={createNote} className="mt-3 px-4 py-2 rounded-lg border-none bg-[#2563eb] text-white cursor-pointer text-[13px]">
                + New Note
              </button>
            </div>
          ) : filteredNotes.length === 0 ? (
            <p className="p-4 text-[#52525b] text-[12px]">No match</p>
          ) : (
            filteredNotes.map((n) => (
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Title */}
          <input
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title"
            className="bg-transparent border-none border-b border-[#27272a] outline-none text-[#fafafa] text-[20px] font-bold px-6 py-4 w-full box-border"
          />
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-6 py-1 border-b border-[#18181b]">
            <button
              onClick={() => setPreview(false)}
              className={`border-none rounded px-[10px] py-[3px] cursor-pointer text-[12px] ${!preview ? 'bg-[#27272a] text-[#fafafa]' : 'bg-transparent text-[#71717a]'}`}
            >
              Edit
            </button>
            <button
              onClick={() => setPreview(true)}
              className={`border-none rounded px-[10px] py-[3px] cursor-pointer text-[12px] ${preview ? 'bg-[#27272a] text-[#fafafa]' : 'bg-transparent text-[#71717a]'}`}
            >
              Preview
            </button>
          </div>

          {/* Content */}
          {preview ? (
            <div className="flex-1 overflow-auto px-6 py-4 text-[#e4e4e7] text-[14px]">
              {content ? <MarkdownContent content={content} /> : <p className="text-[#52525b]">Nothing to preview yet.</p>}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Write something… (Markdown supported)"
              className="flex-1 bg-transparent border-none outline-none text-[#e4e4e7] text-[14px] leading-[1.8] px-6 py-4 resize-none font-mono box-border"
            />
          )}
          {/* Status bar */}
          <div className="border-t border-[#18181b] px-6 py-[6px] flex items-center gap-4">
            <span className="text-[11px] text-[#52525b]">{content.length} chars · {content.split(/\s+/).filter(Boolean).length} words</span>
            <span className="text-[11px] text-[#3f3f46]">{selectedNote ? formatDate(selectedNote.updatedAt) : ''}</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#52525b] flex-col gap-3">
          <span className="text-[40px]">📝</span>
          <p className="text-[14px] text-[#71717a]">Select a note or create a new one</p>
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
      className={`px-4 py-[10px] border-b border-[#18181b] cursor-pointer flex items-start gap-2 ${isSelected ? 'bg-white/[0.06]' : hovered ? 'bg-white/[0.03]' : 'bg-transparent'}`}
    >
      <div className="flex-1 overflow-hidden">
        <p className="text-[13px] text-[#fafafa] m-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium">
          {note.title || 'Untitled'}
        </p>
        <p className="text-[11px] text-[#52525b] mt-[2px] mb-0 overflow-hidden text-ellipsis whitespace-nowrap">
          {preview}
        </p>
        <p className="text-[10px] text-[#3f3f46] mt-[2px] mb-0">{formatDate(note.updatedAt)}</p>
      </div>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="bg-transparent border-none text-[#71717a] cursor-pointer text-[12px] px-[4px] py-[2px] shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  )
}

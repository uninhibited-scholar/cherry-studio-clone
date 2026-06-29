import React, { useState, useRef, useEffect } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { Assistant } from '@shared/data/types/assistant'
import type { Topic } from '@shared/data/types/message'

type Props = {
  assistants: Assistant[]
  selectedAssistantId: string | null
  topics: Topic[]
  selectedTopicId: string | null
  onSelectAssistant: (a: Assistant) => void
  onSelectTopic: (t: Topic) => void
  onNewTopic: () => void
  onDeleteTopic: (id: string) => void
  onRenameTopicLocal: (id: string, title: string) => void
  onCreateAssistant: () => void
}

export function AssistantSidebar({
  assistants,
  selectedAssistantId,
  topics,
  selectedTopicId,
  onSelectAssistant,
  onSelectTopic,
  onNewTopic,
  onDeleteTopic,
  onRenameTopicLocal,
  onCreateAssistant
}: Props) {
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null)
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setSearch('') }, [selectedAssistantId])

  const q = search.trim().toLowerCase()
  const filteredAssistants = q ? assistants.filter((a) => a.name.toLowerCase().includes(q)) : assistants
  const filteredTopics = q ? topics.filter((t) => t.title.toLowerCase().includes(q)) : topics

  useEffect(() => {
    if (editingTopicId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingTopicId])

  function startEdit(t: Topic) {
    setEditingTopicId(t.id)
    setEditValue(t.title)
  }

  async function commitEdit(id: string) {
    const title = editValue.trim()
    if (title) {
      await window.api.invoke(IpcChannel.TOPICS_UPDATE, { id, title })
      onRenameTopicLocal(id, title)
    }
    setEditingTopicId(null)
  }

  function cancelEdit() {
    setEditingTopicId(null)
  }

  return (
    <aside className="w-full flex flex-col border-r border-r-[#27272a] bg-[#09090b] overflow-hidden">
      {/* Search */}
      <div className="px-2 pt-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full bg-[#18181b] border border-[#27272a] rounded-md text-[#fafafa] text-xs outline-none px-2.5 py-[5px]"
        />
      </div>

      {/* Assistants */}
      <div className="px-2 pt-2 pb-1 border-b border-b-[#27272a]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#71717a] font-semibold tracking-widest">ASSISTANTS</span>
          <button
            onClick={onCreateAssistant}
            title="New Assistant"
            className="bg-transparent border-0 text-[#71717a] cursor-pointer text-base leading-none px-0.5"
          >
            +
          </button>
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {filteredAssistants.length === 0 ? (
            <p className="text-[#52525b] text-xs px-2 py-1">{assistants.length === 0 ? 'No assistants yet' : 'No match'}</p>
          ) : (
            filteredAssistants.map((a) => (
              <button
                key={a.id}
                onClick={() => onSelectAssistant(a)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md border-0 cursor-pointer text-sm text-left overflow-hidden ${selectedAssistantId === a.id ? 'bg-white/[0.08] text-[#fafafa]' : 'bg-transparent text-[#a1a1aa]'}`}
              >
                <span className="text-base">{a.emoji ?? '🤖'}</span>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">{a.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Topics */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-2 pt-2.5 pb-1">
          <span className="text-xs text-[#71717a] font-semibold tracking-widest">TOPICS</span>
          {selectedAssistantId && (
            <button
              onClick={onNewTopic}
              title="New Topic"
              className="bg-transparent border-0 text-[#71717a] cursor-pointer text-base leading-none px-0.5"
            >
              +
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filteredTopics.length === 0 ? (
            <p className="text-[#52525b] text-xs py-1">
              {!selectedAssistantId ? 'Select an assistant' : topics.length === 0 ? 'No topics yet' : 'No match'}
            </p>
          ) : (
            filteredTopics.map((t) => (
              <div
                key={t.id}
                onMouseEnter={() => setHoveredTopic(t.id)}
                onMouseLeave={() => setHoveredTopic(null)}
                className={`flex items-center rounded-md ${selectedTopicId === t.id ? 'bg-white/[0.08]' : 'bg-transparent'}`}
              >
                {editingTopicId === t.id ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit(t.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="flex-1 px-2 py-[5px] border border-[#3f3f46] rounded bg-[#18181b] text-[#fafafa] text-xs outline-none"
                  />
                ) : (
                  <button
                    onClick={() => onSelectTopic(t)}
                    onDoubleClick={() => startEdit(t)}
                    title="Double-click to rename"
                    className={`flex-1 px-2 py-1.5 border-0 bg-transparent cursor-pointer text-xs text-left overflow-hidden text-ellipsis whitespace-nowrap ${selectedTopicId === t.id ? 'text-[#fafafa]' : 'text-[#a1a1aa]'}`}
                  >
                    {t.title}
                  </button>
                )}
                {hoveredTopic === t.id && editingTopicId !== t.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteTopic(t.id) }}
                    className="bg-transparent border-0 text-[#71717a] cursor-pointer px-1.5 py-1 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}

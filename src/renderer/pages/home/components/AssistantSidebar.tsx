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
  const inputRef = useRef<HTMLInputElement>(null)

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
    <aside
      style={{
        width: 220,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #27272a',
        background: '#09090b',
        flexShrink: 0,
        overflow: 'hidden'
      }}
    >
      {/* Assistants */}
      <div style={{ padding: '12px 8px 4px', borderBottom: '1px solid #27272a' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#71717a', fontWeight: 600, letterSpacing: 1 }}>ASSISTANTS</span>
          <button
            onClick={onCreateAssistant}
            title="New Assistant"
            style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
          >
            +
          </button>
        </div>
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {assistants.length === 0 ? (
            <p style={{ color: '#52525b', fontSize: 12, padding: '4px 8px' }}>No assistants yet</p>
          ) : (
            assistants.map((a) => (
              <button
                key={a.id}
                onClick={() => onSelectAssistant(a)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '6px 8px', borderRadius: 6, border: 'none',
                  cursor: 'pointer',
                  background: selectedAssistantId === a.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: selectedAssistantId === a.id ? '#fafafa' : '#a1a1aa',
                  fontSize: 13, textAlign: 'left', overflow: 'hidden'
                }}
              >
                <span style={{ fontSize: 16 }}>{a.emoji ?? '🤖'}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Topics */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 8px 4px' }}>
          <span style={{ fontSize: 11, color: '#71717a', fontWeight: 600, letterSpacing: 1 }}>TOPICS</span>
          {selectedAssistantId && (
            <button
              onClick={onNewTopic}
              title="New Topic"
              style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
            >
              +
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
          {topics.length === 0 ? (
            <p style={{ color: '#52525b', fontSize: 12, padding: '4px 0' }}>
              {selectedAssistantId ? 'No topics yet' : 'Select an assistant'}
            </p>
          ) : (
            topics.map((t) => (
              <div
                key={t.id}
                onMouseEnter={() => setHoveredTopic(t.id)}
                onMouseLeave={() => setHoveredTopic(null)}
                style={{
                  display: 'flex', alignItems: 'center', borderRadius: 6,
                  background: selectedTopicId === t.id ? 'rgba(255,255,255,0.08)' : 'transparent'
                }}
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
                    style={{
                      flex: 1, padding: '5px 8px', border: '1px solid #3f3f46',
                      borderRadius: 4, background: '#18181b', color: '#fafafa',
                      fontSize: 12, outline: 'none'
                    }}
                  />
                ) : (
                  <button
                    onClick={() => onSelectTopic(t)}
                    onDoubleClick={() => startEdit(t)}
                    title="Double-click to rename"
                    style={{
                      flex: 1, padding: '6px 8px', border: 'none', background: 'none',
                      cursor: 'pointer',
                      color: selectedTopicId === t.id ? '#fafafa' : '#a1a1aa',
                      fontSize: 12, textAlign: 'left',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}
                  >
                    {t.title}
                  </button>
                )}
                {hoveredTopic === t.id && editingTopicId !== t.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteTopic(t.id) }}
                    style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px 6px', fontSize: 12 }}
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

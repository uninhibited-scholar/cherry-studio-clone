import React, { useState, useRef, useCallback, useEffect } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { KnowledgeBase } from '@shared/data/types/knowledge'

type Props = {
  onSend: (text: string, options: { webSearch: boolean }) => void
  onAbort: () => void
  streaming: boolean
  disabled: boolean
  selectedKnowledgeBaseId: string | null
  onSelectKnowledgeBase: (id: string | null) => void
}

export function InputBar({ onSend, onAbort, streaming, disabled, selectedKnowledgeBaseId, onSelectKnowledgeBase }: Props) {
  const [text, setText] = useState('')
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [showKbPicker, setShowKbPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.api.invoke(IpcChannel.KNOWLEDGE_LIST).then((list) => setKnowledgeBases(list as KnowledgeBase[]))
  }, [])

  // Close picker on outside click
  useEffect(() => {
    if (!showKbPicker) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowKbPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showKbPicker])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed, { webSearch: webSearchEnabled })
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [text, disabled, onSend, webSearchEnabled])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    },
    [handleSend]
  )

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  const selectedKb = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId)

  return (
    <div style={{ borderTop: '1px solid #27272a', padding: '12px 16px', background: '#09090b' }}>
      {/* Toolbar row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, position: 'relative' }}>
        <ToolToggle
          active={webSearchEnabled}
          onClick={() => setWebSearchEnabled((v) => !v)}
          icon="🔍"
          label="Web Search"
          tooltip="Inject search results as context"
        />

        {/* Knowledge base picker */}
        <div style={{ position: 'relative' }}>
          <ToolToggle
            active={!!selectedKnowledgeBaseId}
            onClick={() => setShowKbPicker((v) => !v)}
            icon="📚"
            label={selectedKb ? selectedKb.name : 'Knowledge'}
            tooltip="Attach a knowledge base"
          />
          {showKbPicker && (
            <div
              ref={pickerRef}
              style={{
                position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
                background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8,
                padding: 6, minWidth: 200, zIndex: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
              }}
            >
              <button
                onClick={() => { onSelectKnowledgeBase(null); setShowKbPicker(false) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px',
                  background: !selectedKnowledgeBaseId ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: 'none', borderRadius: 6, color: '#a1a1aa', cursor: 'pointer', fontSize: 12
                }}
              >
                None
              </button>
              {knowledgeBases.length === 0 && (
                <p style={{ fontSize: 11, color: '#52525b', padding: '4px 10px', margin: 0 }}>No knowledge bases yet</p>
              )}
              {knowledgeBases.map((kb) => (
                <button
                  key={kb.id}
                  onClick={() => { onSelectKnowledgeBase(kb.id); setShowKbPicker(false) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px',
                    background: selectedKnowledgeBaseId === kb.id ? 'rgba(37,99,235,0.2)' : 'transparent',
                    border: 'none', borderRadius: 6,
                    color: selectedKnowledgeBaseId === kb.id ? '#60a5fa' : '#fafafa',
                    cursor: 'pointer', fontSize: 12
                  }}
                >
                  📚 {kb.name} <span style={{ color: '#52525b' }}>({kb.documentCount})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, padding: '8px 12px' }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Configure an assistant with a provider and model first…' : 'Message… (Enter to send, Shift+Enter for newline)'}
          rows={1}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fafafa', fontSize: 14, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit', overflowY: 'hidden', minHeight: 24, maxHeight: 200 }}
        />
        <button
          onClick={streaming ? onAbort : handleSend}
          disabled={!streaming && (disabled || !text.trim())}
          title={streaming ? 'Stop' : 'Send'}
          style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            cursor: streaming || (!disabled && text.trim()) ? 'pointer' : 'default',
            background: streaming ? '#dc2626' : '#2563eb',
            color: 'white', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            opacity: !streaming && (disabled || !text.trim()) ? 0.4 : 1,
            transition: 'opacity 0.15s, background 0.15s'
          }}
        >
          {streaming ? '⏹' : '↑'}
        </button>
      </div>
      <p style={{ fontSize: 11, color: '#52525b', marginTop: 6, textAlign: 'center' }}>
        Enter to send · Shift+Enter for newline
        {webSearchEnabled ? ' · 🔍 Web search on' : ''}
        {selectedKb ? ` · 📚 ${selectedKb.name}` : ''}
      </p>
    </div>
  )
}

function ToolToggle({ active, onClick, icon, label, tooltip }: { active: boolean; onClick: () => void; icon: string; label: string; tooltip: string }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 6,
        border: `1px solid ${active ? '#2563eb' : '#3f3f46'}`,
        background: active ? 'rgba(37,99,235,0.15)' : 'transparent',
        color: active ? '#60a5fa' : '#71717a',
        cursor: 'pointer', fontSize: 12, transition: 'all 0.15s',
        maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
      }}
    >
      <span>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    </button>
  )
}

import React, { useEffect, useRef, useState } from 'react'
import type { Message } from '@shared/data/types/message'
import { MarkdownContent } from '../../../components/MarkdownContent'

type Props = {
  messages: Message[]
  streamingText: string
  streaming: boolean
  onDelete?: (id: string) => void
  onRegenerate?: () => void
  onEditResend?: (id: string, newText: string) => void
  showTimestamps?: boolean
  searchQuery?: string
  autoScroll?: boolean
  onMultiDelete?: (ids: string[]) => void
  onQuote?: (message: Message) => void
}

export function MessageThread({ messages, streamingText, streaming, onDelete, onRegenerate, onEditResend, showTimestamps = false, searchQuery = '', autoScroll = true, onMultiDelete, onQuote }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const matchRefs = useRef<Array<HTMLDivElement | null>>([])
  const [matchIdx, setMatchIdx] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const q = searchQuery.trim().toLowerCase()
  const matchedIds = q
    ? messages.filter((m) => m.content.toLowerCase().includes(q)).map((m) => m.id)
    : []

  useEffect(() => {
    if (!q) { setMatchIdx(0); return }
    setMatchIdx(0)
  }, [q])

  useEffect(() => {
    if (matchedIds.length === 0) return
    const el = matchRefs.current[matchIdx]
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [matchIdx, matchedIds.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingText, autoScroll])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === messages.length) setSelected(new Set())
    else setSelected(new Set(messages.map((m) => m.id)))
  }

  const deleteSelected = () => {
    if (selected.size > 0 && onMultiDelete) {
      onMultiDelete(Array.from(selected))
      setSelected(new Set())
    }
  }

  if (messages.length === 0 && !streaming) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#52525b' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
        <p style={{ fontSize: 15, color: '#71717a' }}>Start the conversation</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>Type a message below</p>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Multi-select toolbar */}
      {selected.size > 0 && (
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(37,99,235,0.15)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #2563eb' }}>
          <span style={{ fontSize: 12, color: '#60a5fa' }}>{selected.size} selected</span>
          <button
            onClick={deleteSelected}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}
          >
            Delete Selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}
          >
            ✕ Cancel
          </button>
        </div>
      )}

      {/* In-thread search nav */}
      {q && matchedIds.length > 0 && (
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(9,9,11,0.9)', padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #27272a' }}>
          <span style={{ fontSize: 12, color: '#71717a' }}>{matchedIds.length} result{matchedIds.length > 1 ? 's' : ''}</span>
          <button onClick={() => setMatchIdx((i) => Math.max(0, i - 1))} disabled={matchIdx === 0} style={navBtn}>↑</button>
          <span style={{ fontSize: 12, color: '#a1a1aa' }}>{matchIdx + 1} / {matchedIds.length}</span>
          <button onClick={() => setMatchIdx((i) => Math.min(matchedIds.length - 1, i + 1))} disabled={matchIdx === matchedIds.length - 1} style={navBtn}>↓</button>
        </div>
      )}
      {q && matchedIds.length === 0 && (
        <div style={{ padding: '6px 16px', fontSize: 12, color: '#71717a', background: 'rgba(9,9,11,0.9)', borderBottom: '1px solid #27272a' }}>No results</div>
      )}
      {messages.map((msg, idx) => {
        const matchPos = matchedIds.indexOf(msg.id)
        const isCurrentMatch = matchPos === matchIdx
        const isSelected = selected.has(msg.id)
        return (
          <div key={msg.id} ref={(el) => { if (matchPos >= 0) matchRefs.current[matchPos] = el }} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingLeft: 8, ...(isCurrentMatch ? { outline: '2px solid #2563eb', outlineOffset: -2, borderRadius: 8 } : {}) }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelect(msg.id)}
              style={{ marginTop: 6, accentColor: '#2563eb', cursor: 'pointer' }}
            />
            <div style={{ flex: 1 }}>
              <MessageBubble
              message={msg}
              onDelete={onDelete}
              showTimestamp={showTimestamps}
              isLast={idx === messages.length - 1}
              onRegenerate={msg.role === 'assistant' && idx === messages.length - 1 && !streaming ? onRegenerate : undefined}
              onEditResend={msg.role === 'user' && idx === messages.length - 2 && !streaming ? onEditResend : undefined}
              highlightQuery={q}
              isSelected={isSelected}
              onQuote={onQuote}
            />
            </div>
          </div>
        )
      })}
      {streaming && (
        <MessageBubble
          message={{ id: '__streaming__', topicId: '', role: 'assistant', content: streamingText, fileIds: [], createdAt: Date.now(), updatedAt: Date.now() }}
          isStreaming
          showTimestamp={false}
        />
      )}
      <div ref={bottomRef} />
    </div>
  )
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

const navBtn: React.CSSProperties = {
  background: 'none', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa',
  cursor: 'pointer', fontSize: 12, padding: '1px 7px'
}

function MessageBubble({
  message,
  isStreaming,
  onDelete,
  onRegenerate,
  onEditResend,
  showTimestamp,
  isLast,
  highlightQuery,
  isSelected,
  onQuote
}: {
  message: Message
  isStreaming?: boolean
  onDelete?: (id: string) => void
  onRegenerate?: () => void
  onEditResend?: (id: string, newText: string) => void
  showTimestamp: boolean
  isLast?: boolean
  highlightQuery?: string
  isSelected?: boolean
  onQuote?: (message: Message) => void
}) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)
  const [starred, setStarred] = useState(() => {
    const saved = localStorage.getItem(`starred-msg:${message.id}`)
    return saved === 'true'
  })
  void isLast
  void highlightQuery

  const toggleStar = () => {
    const newState = !starred
    setStarred(newState)
    localStorage.setItem(`starred-msg:${message.id}`, String(newState))
  }

  const copy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', padding: '4px 20px', alignItems: isUser ? 'flex-end' : 'flex-start' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, maxWidth: '80%', width: isUser ? 'auto' : '100%' }}>
        {!isUser && (
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginTop: 2 }}>
            🤖
          </div>
        )}
        <div style={{ flex: isUser ? undefined : 1 }}>
          {isUser ? (
            editing ? (
              <div>
                <textarea
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={3}
                  style={{ width: '100%', background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fafafa', fontSize: 14, lineHeight: 1.6, outline: 'none', padding: '8px 12px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onEditResend?.(message.id, editValue.trim()); setEditing(false) }
                    if (e.key === 'Escape') { setEditing(false); setEditValue(message.content) }
                  }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
                  <button onClick={() => { setEditing(false); setEditValue(message.content) }} style={{ background: 'none', border: '1px solid #3f3f46', color: '#71717a', cursor: 'pointer', fontSize: 12, padding: '3px 10px', borderRadius: 4 }}>Cancel</button>
                  <button onClick={() => { onEditResend?.(message.id, editValue.trim()); setEditing(false) }} style={{ background: '#2563eb', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, padding: '3px 10px', borderRadius: 4 }}>Resend</button>
                </div>
              </div>
            ) : (
            <div style={{
              padding: '10px 14px',
              borderRadius: '16px 16px 4px 16px',
              background: '#2563eb', color: '#fafafa',
              fontSize: 'var(--chat-font-size, 14px)', lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}>
              {message.content}
            </div>
            )
          ) : (
            <div style={{ color: '#e4e4e7', fontSize: 14 }}>
              <MarkdownContent content={message.content || (isStreaming ? '…' : '')} />
              {isStreaming && (
                <span style={{ display: 'inline-block', width: 8, height: 14, background: '#a1a1aa', borderRadius: 2, marginLeft: 2, animation: 'blink 1s step-end infinite', verticalAlign: 'text-bottom' }} />
              )}
            </div>
          )}

          {/* Action bar */}
          {!isStreaming && hovered && (
            <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <button
                onClick={toggleStar}
                style={{ background: 'none', border: '1px solid #3f3f46', color: starred ? '#fbbf24' : '#71717a', cursor: 'pointer', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}
              >
                {starred ? '★' : '☆'} Star
              </button>
              <button
                onClick={copy}
                style={{ background: 'none', border: '1px solid #3f3f46', color: copied ? '#4ade80' : '#71717a', cursor: 'pointer', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}
              >
                {copied ? '✓' : '⎘ Copy'}
              </button>
              <button
                onClick={() => {
                  const md = `# ${isUser ? 'User' : 'Assistant'} Message\n\n${message.content}`
                  const blob = new Blob([md], { type: 'text/markdown' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `message-${message.id.slice(0, 8)}.md`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                style={{ background: 'none', border: '1px solid #3f3f46', color: '#71717a', cursor: 'pointer', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}
              >
                ↓ MD
              </button>
              {onQuote && (
                <button
                  onClick={() => onQuote(message)}
                  style={{ background: 'none', border: '1px solid #3f3f46', color: '#71717a', cursor: 'pointer', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}
                >
                  💬 Quote
                </button>
              )}
              {onEditResend && !editing && (
                <button
                  onClick={() => { setEditing(true); setEditValue(message.content) }}
                  style={{ background: 'none', border: '1px solid #3f3f46', color: '#71717a', cursor: 'pointer', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}
                >
                  ✎ Edit
                </button>
              )}
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  style={{ background: 'none', border: '1px solid #3f3f46', color: '#71717a', cursor: 'pointer', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}
                >
                  ↺ Regenerate
                </button>
              )}
              {onDelete && message.id !== '__streaming__' && (
                <button
                  onClick={() => onDelete(message.id)}
                  style={{ background: 'none', border: '1px solid #3f3f46', color: '#71717a', cursor: 'pointer', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}
                >
                  ✕ Delete
                </button>
              )}
            </div>
          )}

          {showTimestamp && message.createdAt && (
            <p style={{ fontSize: 10, color: '#52525b', margin: '3px 0 0', textAlign: isUser ? 'right' : 'left' }}>
              {formatTime(message.createdAt)}
              {!isUser && message.usage && (message.usage.inputTokens || message.usage.outputTokens) && (
                <span style={{ marginLeft: 8 }}>
                  {message.usage.inputTokens ? `↑${message.usage.inputTokens}` : ''}
                  {message.usage.inputTokens && message.usage.outputTokens ? ' ' : ''}
                  {message.usage.outputTokens ? `↓${message.usage.outputTokens}` : ''} tokens
                </span>
              )}
            </p>
          )}
          {!showTimestamp && !isUser && !isStreaming && hovered && message.usage && (message.usage.inputTokens || message.usage.outputTokens) && (
            <p style={{ fontSize: 10, color: '#3f3f46', margin: '3px 0 0' }}>
              {message.usage.inputTokens ? `↑${message.usage.inputTokens}` : ''}
              {message.usage.inputTokens && message.usage.outputTokens ? ' ' : ''}
              {message.usage.outputTokens ? `↓${message.usage.outputTokens}` : ''} tokens
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

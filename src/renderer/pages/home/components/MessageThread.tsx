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
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>(() => {
    const saved = localStorage.getItem('cherry-clone:message-reactions')
    return saved ? JSON.parse(saved) : {}
  })

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

  const toggleReaction = (msgId: string, emoji: string) => {
    const updated = { ...reactions }
    if (!updated[msgId]) updated[msgId] = {}
    if (updated[msgId][emoji]) {
      updated[msgId][emoji]--
      if (updated[msgId][emoji] === 0) delete updated[msgId][emoji]
    } else {
      updated[msgId][emoji] = 1
    }
    if (Object.keys(updated[msgId]).length === 0) delete updated[msgId]
    setReactions(updated)
    localStorage.setItem('cherry-clone:message-reactions', JSON.stringify(updated))
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      const newTags = [...tags, tag.trim()]
      setTags(newTags)
      localStorage.setItem(`msg-tags:${message.id}`, JSON.stringify(newTags))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag)
    setTags(newTags)
    localStorage.setItem(`msg-tags:${message.id}`, JSON.stringify(newTags))
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
              reactions={reactions[msg.id] ?? {}}
              onToggleReaction={(emoji) => toggleReaction(msg.id, emoji)}
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

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '👀', '🎉']

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
  onQuote,
  reactions,
  onToggleReaction
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
  reactions?: Record<string, number>
  onToggleReaction?: (emoji: string) => void
}) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)
  const [showHistory, setShowHistory] = useState(false)
  const [editHistory, setEditHistory] = useState<Array<{ content: string; editedAt: number }>>(() => {
    const saved = localStorage.getItem(`msg-history:${message.id}`)
    return saved ? JSON.parse(saved) : []
  })
  const [tags, setTags] = useState<string[]>(() => {
    const saved = localStorage.getItem(`msg-tags:${message.id}`)
    return saved ? JSON.parse(saved) : []
  })
  const [showTagInput, setShowTagInput] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [starred, setStarred] = useState(() => {
    const saved = localStorage.getItem(`starred-msg:${message.id}`)
    return saved === 'true'
  })

  // Check if message can be deleted (within 5 minutes)
  const canDelete = (() => {
    const now = Date.now()
    const msgTime = message.createdAt || 0
    const ageSeconds = (now - msgTime) / 1000
    return ageSeconds < 300 // 5 minutes
  })()

  const deleteTimeRemaining = (() => {
    const now = Date.now()
    const msgTime = message.createdAt || 0
    const ageSeconds = (now - msgTime) / 1000
    const remaining = Math.max(0, Math.ceil(300 - ageSeconds))
    return remaining
  })()

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
                  <button onClick={() => {
                    if (editValue.trim() !== message.content) {
                      const newHistory = [...editHistory, { content: message.content, editedAt: Date.now() }]
                      setEditHistory(newHistory)
                      localStorage.setItem(`msg-history:${message.id}`, JSON.stringify(newHistory))
                    }
                    onEditResend?.(message.id, editValue.trim())
                    setEditing(false)
                  }} style={{ background: '#2563eb', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, padding: '3px 10px', borderRadius: 4 }}>Resend</button>
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
              {editHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  style={{ background: 'none', border: '1px solid #3f3f46', color: '#a78bfa', cursor: 'pointer', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}
                >
                  📝 History ({editHistory.length})
                </button>
              )}
              <button
                onClick={() => setShowTagInput((v) => !v)}
                style={{ background: 'none', border: '1px solid #3f3f46', color: tags.length > 0 ? '#60a5fa' : '#71717a', cursor: 'pointer', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}
              >
                🏷️ Tag{tags.length > 0 ? `(${tags.length})` : ''}
              </button>
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
                  onClick={() => canDelete && onDelete(message.id)}
                  disabled={!canDelete}
                  title={canDelete ? 'Delete this message' : `Delete unavailable (${deleteTimeRemaining}s remaining)`}
                  style={{ background: 'none', border: '1px solid #3f3f46', color: canDelete ? '#f87171' : '#52525b', cursor: canDelete ? 'pointer' : 'not-allowed', fontSize: 11, padding: '2px 8px', borderRadius: 4, opacity: canDelete ? 1 : 0.5 }}
                >
                  ✕ {canDelete ? 'Delete' : `${deleteTimeRemaining}s`}
                </button>
              )}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {tags.map((tag) => (
                <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'rgba(96,165,250,0.1)', border: '1px solid #2563eb', borderRadius: 12, fontSize: 11, color: '#60a5fa' }}>
                  <span>{tag}</span>
                  <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, fontSize: 10 }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {showTagInput && (
            <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTag(newTag); if (e.key === 'Escape') { setShowTagInput(false); setNewTag('') } }}
                placeholder="Add tag…"
                style={{ flex: 1, fontSize: 11, padding: '4px 8px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', outline: 'none' }}
                autoFocus
              />
              <button onClick={() => addTag(newTag)} style={{ fontSize: 11, padding: '4px 10px', background: '#2563eb', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>Add</button>
            </div>
          )}

          {/* Edit History */}
          {showHistory && editHistory.length > 0 && (
            <div style={{ marginTop: 8, padding: 8, background: '#18181b', borderRadius: 6, border: '1px solid #27272a' }}>
              <p style={{ fontSize: 11, color: '#a1a1aa', margin: '0 0 6px', fontWeight: 600 }}>Edit History ({editHistory.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                {editHistory.map((edit, idx) => (
                  <div key={idx} style={{ padding: 6, background: '#27272a', borderRadius: 4, fontSize: 11 }}>
                    <p style={{ color: '#a1a1aa', margin: '0 0 4px' }}>
                      {new Date(edit.editedAt).toLocaleTimeString()}
                    </p>
                    <p style={{ color: '#e4e4e7', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 60, overflow: 'hidden' }}>
                      {edit.content.slice(0, 100)}{edit.content.length > 100 ? '…' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reactions */}
          {reactions && Object.keys(reactions).length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {Object.entries(reactions).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => onToggleReaction?.(emoji)}
                  style={{
                    background: 'rgba(37,99,235,0.1)', border: '1px solid #2563eb', borderRadius: 12, padding: '2px 8px',
                    fontSize: 12, color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3
                  }}
                >
                  <span>{emoji}</span>
                  <span style={{ fontSize: 10 }}>{count}</span>
                </button>
              ))}
              {onToggleReaction && hovered && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onToggleReaction(emoji)}
                      style={{
                        background: 'transparent', border: 'none', fontSize: 14, cursor: 'pointer', opacity: 0.6, transition: 'opacity 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {reactions && Object.keys(reactions).length === 0 && hovered && onToggleReaction && (
            <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onToggleReaction(emoji)}
                  style={{
                    background: 'transparent', border: 'none', fontSize: 14, cursor: 'pointer', opacity: 0.5, transition: 'opacity 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                >
                  {emoji}
                </button>
              ))}
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

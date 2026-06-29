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

  const generateShareLink = () => {
    const payload = {
      id: message.id,
      content: message.content,
      role: message.role,
      timestamp: message.createdAt
    }
    const encoded = btoa(JSON.stringify(payload))
    const link = `${window.location.href.split('#')[0]}#/shared/${encoded}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (messages.length === 0 && !streaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#52525b]">
        <div className="text-5xl mb-4">💬</div>
        <p className="text-[15px] text-[#71717a]">Start the conversation</p>
        <p className="text-sm mt-1">Type a message below</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-4 flex flex-col relative">
      {/* Multi-select toolbar */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 bg-[rgba(37,99,235,0.15)] px-4 py-2 flex items-center gap-3 border-b border-b-[#2563eb]">
          <span className="text-xs text-[#60a5fa]">{selected.size} selected</span>
          <button
            onClick={deleteSelected}
            className="bg-transparent border-0 text-[#f87171] cursor-pointer text-xs underline"
          >
            Delete Selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto bg-transparent border-0 text-[#a1a1aa] cursor-pointer text-xs"
          >
            ✕ Cancel
          </button>
        </div>
      )}

      {/* In-thread search nav */}
      {q && matchedIds.length > 0 && (
        <div className="sticky top-0 z-10 bg-[rgba(9,9,11,0.9)] px-4 py-1 flex items-center gap-2 border-b border-b-[#27272a]">
          <span className="text-xs text-[#71717a]">{matchedIds.length} result{matchedIds.length > 1 ? 's' : ''}</span>
          <button onClick={() => setMatchIdx((i) => Math.max(0, i - 1))} disabled={matchIdx === 0} className={navBtnClass}>↑</button>
          <span className="text-xs text-[#a1a1aa]">{matchIdx + 1} / {matchedIds.length}</span>
          <button onClick={() => setMatchIdx((i) => Math.min(matchedIds.length - 1, i + 1))} disabled={matchIdx === matchedIds.length - 1} className={navBtnClass}>↓</button>
        </div>
      )}
      {q && matchedIds.length === 0 && (
        <div className="px-4 py-1.5 text-xs text-[#71717a] bg-[rgba(9,9,11,0.9)] border-b border-b-[#27272a]">No results</div>
      )}
      {messages.map((msg, idx) => {
        const matchPos = matchedIds.indexOf(msg.id)
        const isCurrentMatch = matchPos === matchIdx
        const isSelected = selected.has(msg.id)
        return (
          <div key={msg.id} ref={(el) => { if (matchPos >= 0) matchRefs.current[matchPos] = el }} className={`flex items-start gap-2 pl-2 ${isCurrentMatch ? 'outline outline-2 outline-[#2563eb] -outline-offset-2 rounded-lg' : ''}`}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelect(msg.id)}
              className="mt-1.5 cursor-pointer accent-[#2563eb]"
            />
            <div className="flex-1">
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

const navBtnClass = 'bg-transparent border border-[#3f3f46] rounded text-[#a1a1aa] cursor-pointer text-xs px-[7px] py-[1px]'

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
      className={`flex flex-col px-5 py-1 ${isUser ? 'items-end' : 'items-start'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`flex items-start gap-2.5 max-w-[80%] ${isUser ? 'w-auto' : 'w-full'}`}>
        {!isUser && (
          <div className="w-7 h-7 rounded-md bg-[#3f3f46] flex items-center justify-center text-sm shrink-0 mt-0.5">
            🤖
          </div>
        )}
        <div className={isUser ? undefined : 'flex-1'}>
          {isUser ? (
            editing ? (
              <div>
                <textarea
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={3}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded-lg text-[#fafafa] text-sm leading-[1.6] outline-none px-3 py-2 resize-y font-[inherit] box-border"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onEditResend?.(message.id, editValue.trim()); setEditing(false) }
                    if (e.key === 'Escape') { setEditing(false); setEditValue(message.content) }
                  }}
                />
                <div className="flex gap-1.5 mt-1.5 justify-end">
                  <button onClick={() => { setEditing(false); setEditValue(message.content) }} className="bg-transparent border border-[#3f3f46] text-[#71717a] cursor-pointer text-xs px-2.5 py-[3px] rounded">Cancel</button>
                  <button onClick={() => {
                    if (editValue.trim() !== message.content) {
                      const newHistory = [...editHistory, { content: message.content, editedAt: Date.now() }]
                      setEditHistory(newHistory)
                      localStorage.setItem(`msg-history:${message.id}`, JSON.stringify(newHistory))
                    }
                    onEditResend?.(message.id, editValue.trim())
                    setEditing(false)
                  }} className="bg-[#2563eb] border-0 text-white cursor-pointer text-xs px-2.5 py-[3px] rounded">Resend</button>
                </div>
              </div>
            ) : (
            <div className="px-[14px] py-[10px] rounded-[16px_16px_4px_16px] bg-[#2563eb] text-[#fafafa] text-[length:var(--chat-font-size,14px)] leading-[1.6] whitespace-pre-wrap break-words">
              {message.content}
            </div>
            )
          ) : (
            <div className="text-[#e4e4e7] text-sm">
              <MarkdownContent content={message.content || (isStreaming ? '…' : '')} />
              {isStreaming && (
                <span className="inline-block w-2 h-3.5 bg-[#a1a1aa] rounded-sm ml-0.5 align-text-bottom" style={{ animation: 'blink 1s step-end infinite' }} />
              )}
            </div>
          )}

          {/* Action bar */}
          {!isStreaming && hovered && (
            <div className={`flex gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <button
                onClick={toggleStar}
                className={`bg-transparent border border-[#3f3f46] cursor-pointer text-[11px] px-2 py-0.5 rounded ${starred ? 'text-[#fbbf24]' : 'text-[#71717a]'}`}
              >
                {starred ? '★' : '☆'} Star
              </button>
              <button
                onClick={copy}
                className={`bg-transparent border border-[#3f3f46] cursor-pointer text-[11px] px-2 py-0.5 rounded ${copied ? 'text-[#4ade80]' : 'text-[#71717a]'}`}
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
                className="bg-transparent border border-[#3f3f46] text-[#71717a] cursor-pointer text-[11px] px-2 py-0.5 rounded"
              >
                ↓ MD
              </button>
              <button
                onClick={generateShareLink}
                className="bg-transparent border border-[#3f3f46] text-[#71717a] cursor-pointer text-[11px] px-2 py-0.5 rounded"
                title="Copy shareable link"
              >
                🔗 Share
              </button>
              {onQuote && (
                <button
                  onClick={() => onQuote(message)}
                  className="bg-transparent border border-[#3f3f46] text-[#71717a] cursor-pointer text-[11px] px-2 py-0.5 rounded"
                >
                  💬 Quote
                </button>
              )}
              {editHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="bg-transparent border border-[#3f3f46] text-[#a78bfa] cursor-pointer text-[11px] px-2 py-0.5 rounded"
                >
                  📝 History ({editHistory.length})
                </button>
              )}
              <button
                onClick={() => setShowTagInput((v) => !v)}
                className={`bg-transparent border border-[#3f3f46] cursor-pointer text-[11px] px-2 py-0.5 rounded ${tags.length > 0 ? 'text-[#60a5fa]' : 'text-[#71717a]'}`}
              >
                🏷️ Tag{tags.length > 0 ? `(${tags.length})` : ''}
              </button>
              {onEditResend && !editing && (
                <button
                  onClick={() => { setEditing(true); setEditValue(message.content) }}
                  className="bg-transparent border border-[#3f3f46] text-[#71717a] cursor-pointer text-[11px] px-2 py-0.5 rounded"
                >
                  ✎ Edit
                </button>
              )}
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="bg-transparent border border-[#3f3f46] text-[#71717a] cursor-pointer text-[11px] px-2 py-0.5 rounded"
                >
                  ↺ Regenerate
                </button>
              )}
              {onDelete && message.id !== '__streaming__' && (
                <button
                  onClick={() => canDelete && onDelete(message.id)}
                  disabled={!canDelete}
                  title={canDelete ? 'Delete this message' : `Delete unavailable (${deleteTimeRemaining}s remaining)`}
                  className={`bg-transparent border border-[#3f3f46] cursor-pointer text-[11px] px-2 py-0.5 rounded ${canDelete ? 'text-[#f87171] opacity-100' : 'text-[#52525b] cursor-not-allowed opacity-50'}`}
                >
                  ✕ {canDelete ? 'Delete' : `${deleteTimeRemaining}s`}
                </button>
              )}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-2 flex gap-1 flex-wrap">
              {tags.map((tag) => (
                <div key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(96,165,250,0.1)] border border-[#2563eb] rounded-xl text-[11px] text-[#60a5fa]">
                  <span>{tag}</span>
                  <button onClick={() => removeTag(tag)} className="bg-transparent border-0 text-[#60a5fa] cursor-pointer p-0 text-[10px]">✕</button>
                </div>
              ))}
            </div>
          )}

          {showTagInput && (
            <div className="mt-2 flex gap-1">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTag(newTag); if (e.key === 'Escape') { setShowTagInput(false); setNewTag('') } }}
                placeholder="Add tag…"
                className="flex-1 text-[11px] px-2 py-1 bg-[#27272a] border border-[#3f3f46] rounded text-[#fafafa] outline-none"
                autoFocus
              />
              <button onClick={() => addTag(newTag)} className="text-[11px] px-2.5 py-1 bg-[#2563eb] border-0 rounded text-white cursor-pointer">Add</button>
            </div>
          )}

          {/* Edit History */}
          {showHistory && editHistory.length > 0 && (
            <div className="mt-2 p-2 bg-[#18181b] rounded-md border border-[#27272a]">
              <p className="text-[11px] text-[#a1a1aa] m-0 mb-1.5 font-semibold">Edit History ({editHistory.length})</p>
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                {editHistory.map((edit, idx) => (
                  <div key={idx} className="p-1.5 bg-[#27272a] rounded text-[11px]">
                    <p className="text-[#a1a1aa] m-0 mb-1">
                      {new Date(edit.editedAt).toLocaleTimeString()}
                    </p>
                    <p className="text-[#e4e4e7] m-0 whitespace-pre-wrap break-words max-h-[60px] overflow-hidden">
                      {edit.content.slice(0, 100)}{edit.content.length > 100 ? '…' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reactions */}
          {reactions && Object.keys(reactions).length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {Object.entries(reactions).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => onToggleReaction?.(emoji)}
                  className="bg-[rgba(37,99,235,0.1)] border border-[#2563eb] rounded-xl px-2 py-0.5 text-xs text-[#60a5fa] cursor-pointer flex items-center gap-[3px]"
                >
                  <span>{emoji}</span>
                  <span className="text-[10px]">{count}</span>
                </button>
              ))}
              {onToggleReaction && hovered && (
                <div className="flex gap-0.5">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onToggleReaction(emoji)}
                      className="bg-transparent border-0 text-sm cursor-pointer opacity-60 transition-opacity hover:opacity-100"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {reactions && Object.keys(reactions).length === 0 && hovered && onToggleReaction && (
            <div className="flex gap-0.5 mt-1.5">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onToggleReaction(emoji)}
                  className="bg-transparent border-0 text-sm cursor-pointer opacity-50 transition-opacity hover:opacity-100"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {showTimestamp && message.createdAt && (
            <p className={`text-[10px] text-[#52525b] mt-[3px] mb-0 ${isUser ? 'text-right' : 'text-left'}`}>
              {formatTime(message.createdAt)}
              {!isUser && message.usage && (message.usage.inputTokens || message.usage.outputTokens) && (
                <span className="ml-2">
                  {message.usage.inputTokens ? `↑${message.usage.inputTokens}` : ''}
                  {message.usage.inputTokens && message.usage.outputTokens ? ' ' : ''}
                  {message.usage.outputTokens ? `↓${message.usage.outputTokens}` : ''} tokens
                </span>
              )}
            </p>
          )}
          {!showTimestamp && !isUser && !isStreaming && hovered && message.usage && (message.usage.inputTokens || message.usage.outputTokens) && (
            <p className="text-[10px] text-[#3f3f46] mt-[3px] mb-0">
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

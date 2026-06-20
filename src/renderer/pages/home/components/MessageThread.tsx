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
}

export function MessageThread({ messages, streamingText, streaming, onDelete, onRegenerate, onEditResend, showTimestamps = false }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingText])

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
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column' }}>
      {messages.map((msg, idx) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onDelete={onDelete}
          showTimestamp={showTimestamps}
          isLast={idx === messages.length - 1}
          onRegenerate={msg.role === 'assistant' && idx === messages.length - 1 && !streaming ? onRegenerate : undefined}
          onEditResend={msg.role === 'user' && idx === messages.length - 2 && !streaming ? onEditResend : undefined}
        />
      ))}
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

function MessageBubble({
  message,
  isStreaming,
  onDelete,
  onRegenerate,
  onEditResend,
  showTimestamp,
  isLast
}: {
  message: Message
  isStreaming?: boolean
  onDelete?: (id: string) => void
  onRegenerate?: () => void
  onEditResend?: (id: string, newText: string) => void
  showTimestamp: boolean
  isLast?: boolean
}) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)
  void isLast

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
              fontSize: 14, lineHeight: 1.6,
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
                onClick={copy}
                style={{ background: 'none', border: '1px solid #3f3f46', color: copied ? '#4ade80' : '#71717a', cursor: 'pointer', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}
              >
                {copied ? '✓' : '⎘ Copy'}
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

import React, { useEffect, useRef, useState } from 'react'
import type { Message } from '@shared/data/types/message'
import { MarkdownContent } from '../../../components/MarkdownContent'

type Props = {
  messages: Message[]
  streamingText: string
  streaming: boolean
  onDelete?: (id: string) => void
  showTimestamps?: boolean
}

export function MessageThread({ messages, streamingText, streaming, onDelete, showTimestamps = false }: Props) {
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
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} onDelete={onDelete} showTimestamp={showTimestamps} />
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
  showTimestamp
}: {
  message: Message
  isStreaming?: boolean
  onDelete?: (id: string) => void
  showTimestamp: boolean
}) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

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
            <div style={{
              padding: '10px 14px',
              borderRadius: '16px 16px 4px 16px',
              background: '#2563eb', color: '#fafafa',
              fontSize: 14, lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}>
              {message.content}
            </div>
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

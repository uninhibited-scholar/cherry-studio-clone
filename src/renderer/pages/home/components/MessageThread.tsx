import React, { useEffect, useRef } from 'react'
import type { Message } from '@shared/data/types/message'

type Props = {
  messages: Message[]
  streamingText: string
  streaming: boolean
}

export function MessageThread({ messages, streamingText, streaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  if (messages.length === 0 && !streaming) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#52525b'
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
        <p style={{ fontSize: 15, color: '#71717a' }}>Start the conversation</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>Type a message below</p>
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* In-flight streaming bubble */}
      {streaming && (
        <MessageBubble
          message={{
            id: '__streaming__',
            topicId: '',
            role: 'assistant',
            content: streamingText,
            fileIds: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          }}
          isStreaming
        />
      )}

      <div ref={bottomRef} />
    </div>
  )
}

function MessageBubble({
  message,
  isStreaming
}: {
  message: Message
  isStreaming?: boolean
}) {
  const isUser = message.role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        padding: '2px 24px'
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: '#3f3f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            marginRight: 8,
            flexShrink: 0,
            marginTop: 4
          }}
        >
          🤖
        </div>
      )}
      <div
        style={{
          maxWidth: '72%',
          padding: '10px 14px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? '#2563eb' : '#27272a',
          color: '#fafafa',
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          position: 'relative'
        }}
      >
        {message.content || (isStreaming ? '' : <em style={{ color: '#71717a' }}>empty</em>)}
        {isStreaming && (
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 14,
              background: '#a1a1aa',
              marginLeft: 2,
              borderRadius: 2,
              animation: 'blink 1s step-end infinite',
              verticalAlign: 'text-bottom'
            }}
          />
        )}
      </div>
    </div>
  )
}

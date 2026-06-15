import React, { useState, useRef, useCallback } from 'react'

type Props = {
  onSend: (text: string) => void
  onAbort: () => void
  streaming: boolean
  disabled: boolean
}

export function InputBar({ onSend, onAbort, streaming, disabled }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [text, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  return (
    <div
      style={{
        borderTop: '1px solid #27272a',
        padding: '12px 16px',
        background: '#09090b'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          background: '#18181b',
          border: '1px solid #3f3f46',
          borderRadius: 12,
          padding: '8px 12px'
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Select an assistant and model first…' : 'Message… (Enter to send, Shift+Enter for newline)'}
          rows={1}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#fafafa',
            fontSize: 14,
            lineHeight: 1.6,
            resize: 'none',
            fontFamily: 'inherit',
            overflowY: 'hidden',
            minHeight: 24,
            maxHeight: 200
          }}
        />
        <button
          onClick={streaming ? onAbort : handleSend}
          disabled={!streaming && (disabled || !text.trim())}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            cursor: streaming || (!disabled && text.trim()) ? 'pointer' : 'default',
            background: streaming ? '#dc2626' : '#2563eb',
            color: 'white',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            opacity: !streaming && (disabled || !text.trim()) ? 0.4 : 1,
            transition: 'opacity 0.15s, background 0.15s'
          }}
          title={streaming ? 'Stop generating' : 'Send'}
        >
          {streaming ? '⏹' : '↑'}
        </button>
      </div>
      <p style={{ fontSize: 11, color: '#52525b', marginTop: 6, textAlign: 'center' }}>
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  )
}

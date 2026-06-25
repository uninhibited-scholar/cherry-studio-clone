import React, { useState, useEffect, useRef, useCallback } from 'react'
import { IpcChannel } from '@shared/IpcChannel'

type Role = 'user' | 'assistant'

interface Message {
  id: string
  role: Role
  content: string
}

type StreamChunk =
  | { type: 'text'; text: string }
  | { type: 'done' }
  | { type: 'error'; error: string }

export function QuickAssistantApp(): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [providerId, setProviderId] = useState<string | null>(null)
  const [modelId, setModelId] = useState<string | null>(null)

  const requestIdRef = useRef<string | null>(null)
  const streamingTextRef = useRef('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { streamingTextRef.current = streamingText }, [streamingText])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingText])

  // Load default provider/model from providers list
  useEffect(() => {
    window.api.invoke(IpcChannel.PROVIDERS_LIST).then((providers) => {
      const list = providers as Array<{ id: string; enabled: boolean; models?: Array<{ id: string; enabled: boolean }> }>
      const active = list.find((p) => p.enabled && (p.models ?? []).some((m) => m.enabled))
      if (active) {
        setProviderId(active.id)
        const model = (active.models ?? []).find((m) => m.enabled)
        if (model) setModelId(model.id)
      }
    }).catch(() => {/* non-fatal */})
  }, [])

  // Listen for stream chunks
  useEffect(() => {
    const unsub = window.api.on(IpcChannel.AI_STREAM_CHUNK, (payload: unknown) => {
      const { requestId, chunk } = payload as { requestId: string; chunk: StreamChunk }
      if (requestId !== requestIdRef.current) return

      if (chunk.type === 'text') {
        setStreamingText((prev) => prev + chunk.text)
      } else if (chunk.type === 'done' || chunk.type === 'error') {
        const text = streamingTextRef.current
        setStreamingText('')
        setStreaming(false)
        requestIdRef.current = null
        const content = chunk.type === 'error' ? `*Error: ${chunk.error}*` : text
        if (content) {
          setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content }])
        }
      }
    })
    return unsub
  }, [])

  // Escape key → hide
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        window.api.send(IpcChannel.QUICK_ASSISTANT_HIDE)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return

    if (!providerId || !modelId) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'No AI provider configured. Please set up a provider in Settings first.'
      }])
      return
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
    const requestId = `qa-${Date.now()}-${Math.random().toString(36).slice(2)}`
    requestIdRef.current = requestId
    setStreaming(true)
    setStreamingText('')

    window.api.invoke(IpcChannel.AI_CHAT, {
      requestId,
      providerId,
      modelId,
      messages: history
    }).catch(() => {
      setStreaming(false)
      requestIdRef.current = null
    })
  }, [input, streaming, messages, providerId, modelId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const close = (): void => {
    window.api.send(IpcChannel.QUICK_ASSISTANT_HIDE)
  }

  const clearMessages = (): void => {
    setMessages([])
    setStreamingText('')
    if (requestIdRef.current) {
      window.api.send(IpcChannel.AI_ABORT, requestIdRef.current)
      requestIdRef.current = null
      setStreaming(false)
    }
  }

  return (
    <div className="quick-assistant-root" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#18181b',
      color: '#fafafa',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid #3f3f46'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: '#09090b',
        WebkitAppRegion: 'drag' as React.CSSProperties['WebkitAppRegion'],
        flexShrink: 0,
        borderBottom: '1px solid #27272a'
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa' }}>Quick Assistant</span>
        <div style={{ display: 'flex', gap: 8, WebkitAppRegion: 'no-drag' as React.CSSProperties['WebkitAppRegion'] }}>
          {messages.length > 0 && (
            <button onClick={clearMessages} title="Clear" style={iconBtnStyle}>
              ↺
            </button>
          )}
          <button onClick={close} title="Close (Esc)" style={iconBtnStyle}>
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {messages.length === 0 && !streaming && (
          <div style={{ color: '#52525b', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
            Ask me anything…
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: msg.role === 'user' ? '#3b82f6' : '#27272a',
            color: '#fafafa',
            borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
            padding: '8px 12px',
            fontSize: 13,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {msg.content}
          </div>
        ))}
        {streaming && (
          <div style={{
            alignSelf: 'flex-start',
            maxWidth: '85%',
            background: '#27272a',
            color: '#fafafa',
            borderRadius: '12px 12px 12px 2px',
            padding: '8px 12px',
            fontSize: 13,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {streamingText || <span style={{ color: '#71717a' }}>…</span>}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #27272a',
        background: '#09090b',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message… (Enter to send, Shift+Enter for newline)"
            rows={1}
            style={{
              flex: 1,
              background: '#27272a',
              color: '#fafafa',
              border: '1px solid #3f3f46',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              maxHeight: 120,
              overflow: 'auto'
            }}
            autoFocus
          />
          <button
            onClick={streaming ? undefined : sendMessage}
            disabled={streaming || !input.trim()}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: streaming || !input.trim() ? 0.5 : 1,
              flexShrink: 0
            }}
          >
            {streaming ? '…' : '↑'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#52525b', marginTop: 6, textAlign: 'right' }}>
          Esc to close · {providerId ? `${modelId ?? providerId}` : 'No provider'}
        </div>
      </div>
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#71717a',
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: 1,
  padding: '2px 4px',
  borderRadius: 4
}

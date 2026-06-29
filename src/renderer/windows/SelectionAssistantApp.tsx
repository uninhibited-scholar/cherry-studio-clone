import React, { useEffect, useRef, useState } from 'react'
import { IpcChannel } from '@shared/IpcChannel'

type Action = 'explain' | 'summarize' | 'translate' | 'fix-grammar' | 'continue-writing'

const ACTIONS: { id: Action; label: string; prompt: string }[] = [
  { id: 'explain', label: 'Explain', prompt: 'Explain the following text:\n\n' },
  { id: 'summarize', label: 'Summarize', prompt: 'Summarize the following text:\n\n' },
  { id: 'translate', label: 'Translate', prompt: 'Translate the following text to English:\n\n' },
  { id: 'fix-grammar', label: 'Fix Grammar', prompt: 'Fix the grammar and spelling in the following text:\n\n' },
  { id: 'continue-writing', label: 'Continue writing', prompt: 'Continue writing the following text naturally:\n\n' }
]

type StreamChunk =
  | { type: 'text'; text: string }
  | { type: 'done' }
  | { type: 'error'; error: string }

export function SelectionAssistantApp(): React.ReactElement {
  const [clipboardText, setClipboardText] = useState('')
  const [result, setResult] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [activeAction, setActiveAction] = useState<Action | null>(null)
  const [providerId, setProviderId] = useState<string | null>(null)
  const [modelId, setModelId] = useState<string | null>(null)
  const requestIdRef = useRef<string | null>(null)
  const resultRef = useRef('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { resultRef.current = result }, [result])

  useEffect(() => {
    // Read clipboard
    navigator.clipboard.readText().then(setClipboardText).catch(() => setClipboardText(''))

    // Load default provider/model
    window.api.invoke(IpcChannel.PROVIDERS_LIST).then((providers) => {
      const list = providers as Array<{ id: string; enabled: boolean; models: Array<{ id: string }> }>
      const active = list.find((p) => p.enabled && p.models?.length > 0)
      if (active) {
        setProviderId(active.id)
        setModelId(active.models[0].id)
      }
    })

    // Stream chunks
    const offChunk = window.api.on(IpcChannel.AI_STREAM_CHUNK, (payload: unknown) => {
      const { requestId, chunk } = payload as { requestId: string; chunk: StreamChunk }
      if (requestId !== requestIdRef.current) return
      if (chunk.type === 'text') {
        resultRef.current += chunk.text
        setResult(resultRef.current)
      } else if (chunk.type === 'done') {
        setStreaming(false)
      } else if (chunk.type === 'error') {
        setResult((prev) => prev + `\n[Error: ${chunk.error}]`)
        setStreaming(false)
      }
    })

    return () => { offChunk() }
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [result])

  const runAction = async (action: Action) => {
    if (!providerId || !modelId || streaming) return
    const actionDef = ACTIONS.find((a) => a.id === action)!
    const content = actionDef.prompt + clipboardText

    setActiveAction(action)
    setResult('')
    resultRef.current = ''
    setStreaming(true)

    const requestId = `sel-${Date.now()}`
    requestIdRef.current = requestId

    await window.api.invoke(IpcChannel.AI_CHAT, {
      requestId,
      providerId,
      modelId,
      messages: [{ role: 'user', content }],
      systemPrompt: 'You are a helpful writing assistant. Be concise and clear.',
      temperature: 0.7,
      maxTokens: 1024
    })
  }

  const handleClose = () => {
    if (streaming && requestIdRef.current) {
      window.api.send(IpcChannel.AI_ABORT, requestIdRef.current)
    }
    window.api.send(IpcChannel.SELECTION_ASSISTANT_HIDE)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#18181b',
        color: '#fafafa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '13px'
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: '#09090b',
          borderBottom: '1px solid #27272a',
          WebkitAppRegion: 'drag' as React.CSSProperties['WebkitAppRegion']
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '12px', color: '#a1a1aa' }}>Selection Assistant</span>
        <button
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#71717a',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            WebkitAppRegion: 'no-drag' as React.CSSProperties['WebkitAppRegion']
          }}
        >
          ×
        </button>
      </div>

      {/* Clipboard preview */}
      <div
        style={{
          padding: '8px 12px',
          background: '#1c1c1f',
          borderBottom: '1px solid #27272a',
          maxHeight: '80px',
          overflow: 'auto',
          color: '#a1a1aa',
          fontSize: '12px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {clipboardText || <span style={{ color: '#52525b' }}>No clipboard text</span>}
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          padding: '8px 12px',
          borderBottom: '1px solid #27272a'
        }}
      >
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => runAction(a.id)}
            disabled={streaming || !providerId}
            style={{
              background: activeAction === a.id && (streaming || result) ? '#7c3aed' : '#27272a',
              border: 'none',
              borderRadius: '4px',
              color: '#fafafa',
              padding: '4px 10px',
              cursor: streaming || !providerId ? 'not-allowed' : 'pointer',
              opacity: streaming || !providerId ? 0.6 : 1,
              fontSize: '12px'
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Result area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          padding: '10px 12px',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.6,
          color: result ? '#fafafa' : '#52525b'
        }}
      >
        {result || 'Select an action above to get started'}
        {streaming && <span style={{ opacity: 0.5 }}>▌</span>}
      </div>

      {/* Status bar */}
      {!providerId && (
        <div style={{ padding: '4px 12px', color: '#f59e0b', fontSize: '11px', background: '#09090b' }}>
          No AI provider configured
        </div>
      )}
    </div>
  )
}

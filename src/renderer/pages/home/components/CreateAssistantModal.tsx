import React, { useState, useEffect } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { Provider } from '@shared/data/types/provider'
import type { Model } from '@shared/data/types/model'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (data: { name: string; emoji: string; prompt: string; providerId: string; modelId: string }) => void
}

export function CreateAssistantModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🤖')
  const [prompt, setPrompt] = useState('')
  const [providers, setProviders] = useState<Provider[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [selectedModelId, setSelectedModelId] = useState('')

  useEffect(() => {
    if (!open) return
    window.api.invoke(IpcChannel.PROVIDERS_LIST).then((list) => {
      const ps = list as Provider[]
      setProviders(ps.filter((p) => p.isEnabled))
      if (ps.length > 0) setSelectedProviderId(ps[0].id)
    })
  }, [open])

  useEffect(() => {
    if (!selectedProviderId) return
    window.api.invoke(IpcChannel.MODELS_LIST, selectedProviderId).then((list) => {
      const ms = list as Model[]
      setModels(ms.filter((m) => m.isEnabled))
      if (ms.length > 0) setSelectedModelId(ms[0].id)
    })
  }, [selectedProviderId])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreated({ name: name.trim(), emoji, prompt, providerId: selectedProviderId, modelId: selectedModelId })
    setName('')
    setEmoji('🤖')
    setPrompt('')
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#18181b',
          border: '1px solid #3f3f46',
          borderRadius: 12,
          padding: 24,
          width: 440,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        <h2 style={{ color: '#fafafa', margin: 0, fontSize: 16 }}>New Assistant</h2>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            style={{ width: 48, ...inputStyle }}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Assistant name"
            required
            style={{ flex: 1, ...inputStyle }}
          />
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="System prompt (optional)"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        <select
          value={selectedProviderId}
          onChange={(e) => setSelectedProviderId(e.target.value)}
          style={inputStyle}
        >
          {providers.length === 0 && <option value="">No providers — add one in Settings</option>}
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
          style={inputStyle}
          disabled={models.length === 0}
        >
          {models.length === 0 && <option value="">No models for this provider</option>}
          {models.map((m) => (
            <option key={m.id} value={m.id}>{m.displayName ?? m.name}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnStyle('#27272a')}>Cancel</button>
          <button type="submit" style={btnStyle('#2563eb')}>Create</button>
        </div>
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#27272a',
  border: '1px solid #3f3f46',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#fafafa',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
}

const btnStyle = (bg: string): React.CSSProperties => ({
  padding: '8px 18px',
  borderRadius: 8,
  border: 'none',
  background: bg,
  color: '#fafafa',
  fontSize: 13,
  cursor: 'pointer'
})

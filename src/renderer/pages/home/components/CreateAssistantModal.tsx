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
      const enabled = ps.filter((p) => p.isEnabled)
      setProviders(enabled)
      if (enabled.length > 0) setSelectedProviderId(enabled[0].id)
    })
  }, [open])

  useEffect(() => {
    if (!selectedProviderId) return
    window.api.invoke(IpcChannel.MODELS_LIST, selectedProviderId).then((list) => {
      const ms = list as Model[]
      const enabled = ms.filter((m) => m.isEnabled)
      setModels(enabled)
      if (enabled.length > 0) setSelectedModelId(enabled[0].id)
      else setSelectedModelId('')
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
            style={{ ...inputStyle, width: 48, flexShrink: 0, textAlign: 'center', padding: '8px 4px' }}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="助手名称"
            required
            style={{ ...inputStyle, flex: 1, width: 'auto' }}
          />
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="System prompt (optional)"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        {providers.length === 0 ? (
          <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.4)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fbbf24' }}>
            ⚠️ 还没有可用的 Provider。请先到{' '}
            <button
              type="button"
              onClick={() => { onClose(); window.location.hash = '#/settings' }}
              style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, fontSize: 13, textDecoration: 'underline' }}
            >
              设置 → Providers
            </button>
            {' '}添加 API Key 并启用至少一个模型。
          </div>
        ) : (
          <>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              style={inputStyle}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {models.length === 0 ? (
              <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.4)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fbbf24' }}>
                ⚠️ 该 Provider 下没有启用的模型。请到{' '}
                <button
                  type="button"
                  onClick={() => { onClose(); window.location.hash = '#/settings' }}
                  style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, fontSize: 13, textDecoration: 'underline' }}
                >
                  设置 → Providers
                </button>
                {' '}启用至少一个模型。
              </div>
            ) : (
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                style={inputStyle}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.displayName ?? m.name}</option>
                ))}
              </select>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnStyle('#27272a')}>取消</button>
          <button type="submit" disabled={providers.length === 0 || !selectedModelId} style={btnStyle(providers.length === 0 || !selectedModelId ? '#374151' : '#2563eb')}>创建</button>
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

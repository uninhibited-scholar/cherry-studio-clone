import React, { useState, useEffect, useCallback } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { Provider } from '@shared/data/types/provider'
import type { Model } from '@shared/data/types/model'
import { nanoid } from 'nanoid'

const BUILTIN_PROVIDERS = [
  { name: 'OpenAI', defaultEndpointType: 'openai_chat_completions' as const, defaultModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { name: 'Anthropic', defaultEndpointType: 'anthropic_messages' as const, defaultModels: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'] },
  { name: 'Google Gemini', defaultEndpointType: 'google_gemini' as const, defaultModels: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'] },
  { name: 'Ollama', defaultEndpointType: 'openai_chat_completions' as const, defaultModels: [] }
]

type Preset = { id: string; name: string; providerId: string; modelId: string }

export function ProvidersSettings() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [models, setModels] = useState<Record<string, Model[]>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<Record<string, string>>({})
  const [editingHost, setEditingHost] = useState<Record<string, string>>({})
  const [newModelName, setNewModelName] = useState<Record<string, string>>({})
  const [testStatus, setTestStatus] = useState<Record<string, { ok: boolean; text?: string; error?: string } | 'testing'>>({})
  const [presets, setPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem('cherry-clone:model-presets')
    return saved ? JSON.parse(saved) : []
  })
  const [presetName, setPresetName] = useState('')
  const [selectedForPreset, setSelectedForPreset] = useState<{ providerId: string; modelId: string } | null>(null)

  const testProvider = async (p: Provider) => {
    setTestStatus((prev) => ({ ...prev, [p.id]: 'testing' }))
    const res = await window.api.invoke(IpcChannel.PROVIDER_TEST, { providerId: p.id }) as { ok: boolean; text?: string; error?: string }
    setTestStatus((prev) => ({ ...prev, [p.id]: res }))
  }

  const refresh = useCallback(async () => {
    const ps = (await window.api.invoke(IpcChannel.PROVIDERS_LIST)) as Provider[]
    setProviders(ps)
    const modelMap: Record<string, Model[]> = {}
    for (const p of ps) {
      modelMap[p.id] = (await window.api.invoke(IpcChannel.MODELS_LIST, p.id)) as Model[]
    }
    setModels(modelMap)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const addBuiltinProvider = async (template: (typeof BUILTIN_PROVIDERS)[number]) => {
    const id = nanoid()
    const p = await window.api.invoke(IpcChannel.PROVIDERS_UPSERT, {
      id,
      name: template.name,
      defaultEndpointType: template.defaultEndpointType,
      isEnabled: true,
      isBuiltin: true
    }) as Provider

    // Add default models
    for (const modelName of template.defaultModels) {
      await window.api.invoke(IpcChannel.MODELS_LIST + ':upsert', {
        providerId: p.id,
        name: modelName,
        displayName: modelName,
        isEnabled: true
      })
    }
    await refresh()
    setExpanded(p.id)
  }

  const saveProviderKey = async (p: Provider) => {
    await window.api.invoke(IpcChannel.PROVIDERS_UPSERT, {
      ...p,
      apiKey: editingKey[p.id] ?? p.apiKey,
      apiHost: editingHost[p.id] ?? p.apiHost
    })
    await refresh()
  }

  const deleteProvider = async (id: string) => {
    if (!confirm('Delete this provider?')) return
    await window.api.invoke(IpcChannel.PROVIDERS_DELETE, id)
    await refresh()
    if (expanded === id) setExpanded(null)
  }

  const addModel = async (providerId: string) => {
    const name = (newModelName[providerId] ?? '').trim()
    if (!name) return
    await window.api.invoke(IpcChannel.MODELS_LIST, providerId) // refresh
    // Upsert model via IPC — reuse MODELS_LIST channel suffix workaround
    await window.api.invoke('models:upsert', { providerId, name, displayName: name, isEnabled: true })
    setNewModelName((prev) => ({ ...prev, [providerId]: '' }))
    await refresh()
  }

  const toggleModel = async (m: Model) => {
    await window.api.invoke('models:upsert', { ...m, isEnabled: !m.isEnabled })
    await refresh()
  }

  const savePreset = () => {
    if (!presetName.trim() || !selectedForPreset) return
    const newPreset: Preset = {
      id: nanoid(),
      name: presetName.trim(),
      providerId: selectedForPreset.providerId,
      modelId: selectedForPreset.modelId
    }
    const updated = [...presets, newPreset]
    setPresets(updated)
    localStorage.setItem('cherry-clone:model-presets', JSON.stringify(updated))
    setPresetName('')
    setSelectedForPreset(null)
  }

  const deletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id)
    setPresets(updated)
    localStorage.setItem('cherry-clone:model-presets', JSON.stringify(updated))
  }

  return (
    <div>
      <h2 style={{ color: '#fafafa', fontSize: 18, marginBottom: 4 }}>AI Providers</h2>
      <p style={{ color: '#71717a', fontSize: 13, marginBottom: 20 }}>
        Manage provider API keys and models. Keys are stored locally.
      </p>

      {/* Model Presets Section */}
      {presets.length > 0 && (
        <div style={{ marginBottom: 24, padding: 12, background: '#111113', borderRadius: 8, border: '1px solid #27272a' }}>
          <p style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 10, fontWeight: 600 }}>⚡ Quick Model Presets</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {presets.map((preset) => {
              const prov = providers.find((p) => p.id === preset.providerId)
              return (
                <div key={preset.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(37,99,235,0.1)', border: '1px solid #2563eb', borderRadius: 6 }}>
                  <span style={{ color: '#60a5fa', fontSize: 12 }}>{preset.name}</span>
                  <span style={{ color: '#52525b', fontSize: 11 }}>({prov?.name ?? 'unknown'} / {preset.modelId})</span>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 11, padding: '0 2px' }}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Save New Preset */}
      <div style={{ marginBottom: 20, padding: 12, background: '#111113', borderRadius: 8, border: '1px solid #27272a' }}>
        <p style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 10, fontWeight: 600 }}>💾 Save Current Selection as Preset</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <select
            value={selectedForPreset?.providerId ?? ''}
            onChange={(e) => {
              if (e.target.value) {
                const provider = providers.find((p) => p.id === e.target.value)
                const firstModel = (models[e.target.value] ?? [])[0]
                if (provider && firstModel) {
                  setSelectedForPreset({ providerId: provider.id, modelId: firstModel.id })
                }
              }
            }}
            style={{ flex: 1, ...inputSty }}
          >
            <option value="">Select Provider</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {selectedForPreset && (
            <select
              value={selectedForPreset.modelId}
              onChange={(e) => setSelectedForPreset({ ...selectedForPreset, modelId: e.target.value })}
              style={{ flex: 1, ...inputSty }}
            >
              {(models[selectedForPreset.providerId] ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.displayName ?? m.name}</option>
              ))}
            </select>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name (e.g. 'Fast Drafts', 'Research')"
            onKeyDown={(e) => e.key === 'Enter' && savePreset()}
            style={{ flex: 1, ...inputSty }}
          />
          <button onClick={savePreset} disabled={!presetName.trim() || !selectedForPreset} style={btnSty}>Save</button>
        </div>
      </div>

      {/* Quick-add builtins */}
      {BUILTIN_PROVIDERS.filter(
        (b) => !providers.some((p) => p.name === b.name)
      ).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 8 }}>Quick add:</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {BUILTIN_PROVIDERS.filter((b) => !providers.some((p) => p.name === b.name)).map((b) => (
              <button
                key={b.name}
                onClick={() => addBuiltinProvider(b)}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #3f3f46', background: 'transparent', color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}
              >
                + {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Provider list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {providers.map((p) => (
          <div key={p.id} style={{ border: '1px solid #27272a', borderRadius: 10, overflow: 'hidden' }}>
            {/* Header */}
            <div
              style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', gap: 10 }}
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <span style={{ color: '#fafafa', fontSize: 14, fontWeight: 500, flex: 1 }}>{p.name}</span>
              <span style={{ color: '#52525b', fontSize: 12 }}>{(models[p.id] ?? []).length} models</span>
              {testStatus[p.id] && testStatus[p.id] !== 'testing' && (
                <span style={{ fontSize: 11, color: (testStatus[p.id] as { ok: boolean }).ok ? '#4ade80' : '#f87171' }}>
                  {(testStatus[p.id] as { ok: boolean }).ok ? '✓ Connected' : '✗ Failed'}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); testProvider(p) }}
                disabled={testStatus[p.id] === 'testing'}
                style={{ background: 'none', border: '1px solid #3f3f46', borderRadius: 4, color: '#71717a', cursor: 'pointer', fontSize: 11, padding: '2px 8px' }}
              >
                {testStatus[p.id] === 'testing' ? '…' : 'Test'}
              </button>
              <span style={{ color: '#71717a', fontSize: 12 }}>{expanded === p.id ? '▲' : '▼'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteProvider(p.id) }}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 13 }}
              >
                🗑
              </button>
            </div>

            {expanded === p.id && (
              <div style={{ borderTop: '1px solid #27272a', padding: 16, background: '#111113' }}>
                {/* API Key */}
                <label style={{ display: 'block', marginBottom: 12 }}>
                  <span style={{ color: '#a1a1aa', fontSize: 12, display: 'block', marginBottom: 4 }}>API Key</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="password"
                      defaultValue={p.apiKey ?? ''}
                      onChange={(e) => setEditingKey((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="sk-…"
                      style={{ flex: 1, ...inputSty }}
                    />
                    <button onClick={() => saveProviderKey(p)} style={btnSty}>Save</button>
                  </div>
                </label>

                {/* API Host (optional for custom / Ollama) */}
                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span style={{ color: '#a1a1aa', fontSize: 12, display: 'block', marginBottom: 4 }}>
                    API Host <span style={{ color: '#52525b' }}>(optional)</span>
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      defaultValue={p.apiHost ?? ''}
                      onChange={(e) => setEditingHost((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="https://api.openai.com/v1"
                      style={{ flex: 1, ...inputSty }}
                    />
                    <button onClick={() => saveProviderKey(p)} style={btnSty}>Save</button>
                  </div>
                </label>

                {/* Models */}
                <p style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 8 }}>Models</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                  {(models[p.id] ?? []).map((m) => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={m.isEnabled}
                        onChange={() => toggleModel(m)}
                        style={{ accentColor: '#2563eb' }}
                      />
                      <span style={{ color: m.isEnabled ? '#fafafa' : '#52525b', fontSize: 13 }}>
                        {m.displayName ?? m.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Add custom model */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={newModelName[p.id] ?? ''}
                    onChange={(e) => setNewModelName((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="Add model ID (e.g. gpt-4o)"
                    onKeyDown={(e) => e.key === 'Enter' && addModel(p.id)}
                    style={{ flex: 1, ...inputSty }}
                  />
                  <button onClick={() => addModel(p.id)} style={btnSty}>Add</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const inputSty: React.CSSProperties = {
  background: '#27272a',
  border: '1px solid #3f3f46',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#fafafa',
  fontSize: 13,
  outline: 'none'
}

const btnSty: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#fafafa',
  fontSize: 13,
  cursor: 'pointer',
  whiteSpace: 'nowrap'
}

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

export function ProvidersSettings() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [models, setModels] = useState<Record<string, Model[]>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<Record<string, string>>({})
  const [editingHost, setEditingHost] = useState<Record<string, string>>({})
  const [newModelName, setNewModelName] = useState<Record<string, string>>({})

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

  return (
    <div>
      <h2 style={{ color: '#fafafa', fontSize: 18, marginBottom: 4 }}>AI Providers</h2>
      <p style={{ color: '#71717a', fontSize: 13, marginBottom: 20 }}>
        Manage provider API keys and models. Keys are stored locally.
      </p>

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

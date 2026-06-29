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
      await window.api.invoke(IpcChannel.MODELS_UPSERT, {
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
    await window.api.invoke(IpcChannel.MODELS_UPSERT, { providerId, name, displayName: name, isEnabled: true })
    setNewModelName((prev) => ({ ...prev, [providerId]: '' }))
    await refresh()
  }

  const toggleModel = async (m: Model) => {
    await window.api.invoke(IpcChannel.MODELS_UPSERT, { ...m, isEnabled: !m.isEnabled })
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
      <h2 className="text-[#fafafa] text-[18px] mb-1">AI Providers</h2>
      <p className="text-[#71717a] text-[13px] mb-5">
        Manage provider API keys and models. Keys are stored locally.
      </p>

      {/* Local Models Info */}
      <div className="mb-5 p-3 bg-[rgba(96,165,250,0.05)] border border-[#2563eb] rounded-lg">
        <p className="text-[#60a5fa] text-[12px] font-semibold mb-2">💡 Running Local Models?</p>
        <p className="text-[#a1a1aa] text-[12px] mb-2 leading-relaxed">
          Use <strong>Ollama</strong> to run models locally. <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] underline">Install Ollama</a>, run <code className="bg-[#09090b] px-[6px] py-[2px] rounded text-[11px]">ollama pull llama2</code>, then add as provider with API host <code className="bg-[#09090b] px-[6px] py-[2px] rounded text-[11px]">http://localhost:11434</code>
        </p>
      </div>

      {/* Model Presets Section */}
      {presets.length > 0 && (
        <div className="mb-6 p-3 bg-[#111113] rounded-lg border border-[#27272a]">
          <p className="text-[#a1a1aa] text-[12px] mb-[10px] font-semibold">⚡ Quick Model Presets</p>
          <div className="flex gap-2 flex-wrap">
            {presets.map((preset) => {
              const prov = providers.find((p) => p.id === preset.providerId)
              return (
                <div key={preset.id} className="flex items-center gap-[6px] px-[10px] py-1 bg-[rgba(37,99,235,0.1)] border border-[#2563eb] rounded-[6px]">
                  <span className="text-[#60a5fa] text-[12px]">{preset.name}</span>
                  <span className="text-[#52525b] text-[11px]">({prov?.name ?? 'unknown'} / {preset.modelId})</span>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="bg-none border-none text-[#71717a] cursor-pointer text-[11px] px-[2px]"
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
      <div className="mb-5 p-3 bg-[#111113] rounded-lg border border-[#27272a]">
        <p className="text-[#a1a1aa] text-[12px] mb-[10px] font-semibold">💾 Save Current Selection as Preset</p>
        <div className="flex gap-2 mb-[10px]">
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
            className={inputCls}
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
              className={inputCls}
            >
              {(models[selectedForPreset.providerId] ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.displayName ?? m.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name (e.g. 'Fast Drafts', 'Research')"
            onKeyDown={(e) => e.key === 'Enter' && savePreset()}
            className={inputCls}
          />
          <button onClick={savePreset} disabled={!presetName.trim() || !selectedForPreset} className={btnCls}>Save</button>
        </div>
      </div>

      {/* Quick-add builtins */}
      {BUILTIN_PROVIDERS.filter(
        (b) => !providers.some((p) => p.name === b.name)
      ).length > 0 && (
        <div className="mb-5">
          <p className="text-[#a1a1aa] text-[12px] mb-2">Quick add:</p>
          <div className="flex gap-2 flex-wrap">
            {BUILTIN_PROVIDERS.filter((b) => !providers.some((p) => p.name === b.name)).map((b) => (
              <button
                key={b.name}
                onClick={() => addBuiltinProvider(b)}
                className="px-[14px] py-[6px] rounded-lg border border-[#3f3f46] bg-transparent text-[#a1a1aa] cursor-pointer text-[12px]"
              >
                + {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Provider list */}
      <div className="flex flex-col gap-[10px]">
        {providers.map((p) => (
          <div key={p.id} className="border border-[#27272a] rounded-[10px] overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center px-4 py-3 cursor-pointer gap-[10px]"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <span className="text-[#fafafa] text-[14px] font-medium flex-1">{p.name}</span>
              <span className="text-[#52525b] text-[12px]">{(models[p.id] ?? []).length} models</span>
              {testStatus[p.id] && testStatus[p.id] !== 'testing' && (
                <span className={`text-[11px] ${(testStatus[p.id] as { ok: boolean }).ok ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                  {(testStatus[p.id] as { ok: boolean }).ok ? '✓ Connected' : '✗ Failed'}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); testProvider(p) }}
                disabled={testStatus[p.id] === 'testing'}
                className="bg-none border border-[#3f3f46] rounded text-[#71717a] cursor-pointer text-[11px] px-2 py-[2px]"
              >
                {testStatus[p.id] === 'testing' ? '…' : 'Test'}
              </button>
              <span className="text-[#71717a] text-[12px]">{expanded === p.id ? '▲' : '▼'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteProvider(p.id) }}
                className="bg-none border-none text-[#71717a] cursor-pointer text-[13px]"
              >
                🗑
              </button>
            </div>

            {expanded === p.id && (
              <div className="border-t border-[#27272a] p-4 bg-[#111113]">
                {/* API Key */}
                <label className="block mb-3">
                  <span className="text-[#a1a1aa] text-[12px] block mb-1">API Key</span>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      defaultValue={p.apiKey ?? ''}
                      onChange={(e) => setEditingKey((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="sk-…"
                      className={`flex-1 ${inputCls}`}
                    />
                    <button onClick={() => saveProviderKey(p)} className={btnCls}>Save</button>
                  </div>
                </label>

                {/* API Host (optional for custom / Ollama) */}
                <label className="block mb-4">
                  <span className="text-[#a1a1aa] text-[12px] block mb-1">
                    API Host <span className="text-[#52525b]">(optional)</span>
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      defaultValue={p.apiHost ?? ''}
                      onChange={(e) => setEditingHost((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="https://api.openai.com/v1"
                      className={`flex-1 ${inputCls}`}
                    />
                    <button onClick={() => saveProviderKey(p)} className={btnCls}>Save</button>
                  </div>
                </label>

                {/* Models */}
                <p className="text-[#a1a1aa] text-[12px] mb-2">Models</p>
                <div className="flex flex-col gap-1 mb-3">
                  {(models[p.id] ?? []).map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={m.isEnabled}
                        onChange={() => toggleModel(m)}
                        className="accent-[#2563eb]"
                      />
                      <span className={`text-[13px] ${m.isEnabled ? 'text-[#fafafa]' : 'text-[#52525b]'}`}>
                        {m.displayName ?? m.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Add custom model */}
                <div className="flex gap-2">
                  <input
                    value={newModelName[p.id] ?? ''}
                    onChange={(e) => setNewModelName((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="Add model ID (e.g. gpt-4o)"
                    onKeyDown={(e) => e.key === 'Enter' && addModel(p.id)}
                    className={`flex-1 ${inputCls}`}
                  />
                  <button onClick={() => addModel(p.id)} className={btnCls}>Add</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const inputCls = 'bg-[#27272a] border border-[#3f3f46] rounded-lg px-3 py-2 text-[#fafafa] text-[13px] outline-none'

const btnCls = 'px-[14px] py-2 rounded-lg border-none bg-[#2563eb] text-[#fafafa] text-[13px] cursor-pointer whitespace-nowrap'

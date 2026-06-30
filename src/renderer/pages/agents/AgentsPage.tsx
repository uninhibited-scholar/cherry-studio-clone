import React, { useState, useEffect, useCallback } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { Assistant } from '@shared/data/types/assistant'
import type { Provider } from '@shared/data/types/provider'
import type { Model } from '@shared/data/types/model'

const EMOJI_OPTIONS = ['🤖', '🧠', '💡', '🔬', '📝', '🎯', '🌍', '⚡', '🎨', '🔧', '📚', '🚀']

export function AgentsPage(): React.ReactElement {
  const [agents, setAgents] = useState<Assistant[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [allModels, setAllModels] = useState<Model[]>([])
  const [editing, setEditing] = useState<Partial<Assistant> | null>(null)
  const [isNew, setIsNew] = useState(false)

  const load = useCallback(async () => {
    const [list, provList] = await Promise.all([
      window.api.invoke(IpcChannel.ASSISTANTS_LIST) as Promise<Assistant[]>,
      window.api.invoke(IpcChannel.PROVIDERS_LIST) as Promise<Provider[]>
    ])
    setAgents(list.filter((a) => !a.isBuiltin))
    setProviders(provList)

    if (provList.length > 0) {
      const models = await window.api.invoke(IpcChannel.MODELS_LIST) as Model[]
      setAllModels(models)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const startNew = () => {
    setEditing({
      name: '',
      emoji: '🤖',
      description: '',
      prompt: '',
      temperature: 1,
      providerId: providers[0]?.id,
      modelId: allModels[0]?.id
    })
    setIsNew(true)
  }

  const startEdit = (agent: Assistant) => {
    setEditing({ ...agent })
    setIsNew(false)
  }

  const handleSave = async () => {
    if (!editing?.name?.trim()) return
    const saved = await window.api.invoke(IpcChannel.ASSISTANTS_UPSERT, editing) as Assistant
    if (isNew) {
      setAgents((prev) => [...prev, saved])
    } else {
      setAgents((prev) => prev.map((a) => a.id === saved.id ? saved : a))
    }
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    await window.api.invoke(IpcChannel.ASSISTANTS_DELETE, id)
    setAgents((prev) => prev.filter((a) => a.id !== id))
    if (editing && (editing as Assistant).id === id) setEditing(null)
  }

  const modelsForProvider = editing?.providerId
    ? allModels.filter((m) => m.providerId === editing.providerId)
    : allModels

  return (
    <div className="flex h-full bg-[rgba(10,0,20,0.60)] text-[#fafafa]">
      {/* ── Agent list ── */}
      <aside className="w-[260px] border-r border-[#27272a] flex flex-col shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
          <span className="text-[13px] font-semibold">My Agents</span>
          <button
            onClick={startNew}
            className="bg-transparent border-none text-[#a1a1aa] cursor-pointer text-[20px] leading-none px-[2px]"
            title="New agent"
          >
            +
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {agents.length === 0 ? (
            <div className="p-8 text-center text-[#52525b]">
              <p className="text-[13px]">No custom agents yet</p>
              <button onClick={startNew} className="mt-3 bg-[#2563eb] border-none rounded-md text-white cursor-pointer text-[12px] font-semibold px-[14px] py-[6px]">+ New Agent</button>
            </div>
          ) : (
            agents.map((agent) => (
              <AgentListItem
                key={agent.id}
                agent={agent}
                isSelected={editing && !isNew && (editing as Assistant).id === agent.id}
                onSelect={() => startEdit(agent)}
                onDelete={() => handleDelete(agent.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Editor ── */}
      {editing ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor header */}
          <div className="px-6 py-[14px] border-b border-[#27272a] flex items-center justify-between">
            <h2 className="m-0 text-[15px] font-bold">{isNew ? 'New Agent' : 'Edit Agent'}</h2>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="bg-[#27272a] border-none rounded-md text-[#a1a1aa] cursor-pointer text-[12px] px-[14px] py-[6px]">Cancel</button>
              <button onClick={handleSave} className="bg-[#2563eb] border-none rounded-md text-white cursor-pointer text-[12px] font-semibold px-[14px] py-[6px]">Save</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Emoji + Name */}
            <div className="flex gap-[10px] mb-4">
              <div>
                <label className="block text-[11px] text-[#71717a] mb-1">Emoji</label>
                <select
                  value={editing.emoji ?? '🤖'}
                  onChange={(e) => setEditing((p) => ({ ...p, emoji: e.target.value }))}
                  className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[18px] outline-none px-[10px] py-[6px] w-16 text-center"
                >
                  {EMOJI_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] text-[#71717a] mb-1">Name *</label>
                <input
                  value={editing.name ?? ''}
                  onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Agent name"
                  className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full box-border"
                />
              </div>
            </div>

            {/* Description */}
            <label className="block text-[11px] text-[#71717a] mb-1">Description</label>
            <input
              value={editing.description ?? ''}
              onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))}
              placeholder="Short description of this agent's purpose"
              className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full box-border mb-4"
            />

            {/* System Prompt */}
            <label className="block text-[11px] text-[#71717a] mb-1">System Prompt</label>
            <textarea
              value={editing.prompt ?? ''}
              onChange={(e) => setEditing((p) => ({ ...p, prompt: e.target.value }))}
              placeholder="You are a helpful assistant that…"
              rows={8}
              className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full box-border mb-4 resize-y font-mono"
            />

            {/* Provider + Model */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-[11px] text-[#71717a] mb-1">Default Provider</label>
                <select
                  value={editing.providerId ?? ''}
                  onChange={(e) => setEditing((p) => ({ ...p, providerId: e.target.value, modelId: undefined }))}
                  className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full box-border"
                >
                  <option value="">— any —</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] text-[#71717a] mb-1">Default Model</label>
                <select
                  value={editing.modelId ?? ''}
                  onChange={(e) => setEditing((p) => ({ ...p, modelId: e.target.value }))}
                  className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full box-border"
                >
                  <option value="">— any —</option>
                  {modelsForProvider.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            {/* Temperature */}
            <label className="block text-[11px] text-[#71717a] mb-1">Temperature: {(editing.temperature ?? 1).toFixed(1)}</label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={editing.temperature ?? 1}
              onChange={(e) => setEditing((p) => ({ ...p, temperature: parseFloat(e.target.value) }))}
              className="w-full mb-4"
            />

            {/* Max tokens */}
            <label className="block text-[11px] text-[#71717a] mb-1">Max Tokens</label>
            <input
              type="number"
              value={editing.maxTokens ?? ''}
              onChange={(e) => setEditing((p) => ({ ...p, maxTokens: e.target.value ? parseInt(e.target.value) : undefined }))}
              placeholder="Unlimited"
              className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full box-border mb-4"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-3 text-[#52525b]">
          <span className="text-[56px]">🤖</span>
          <p className="text-[14px] text-[#71717a]">Select an agent to edit, or create a new one</p>
          <button onClick={startNew} className="bg-[#2563eb] border-none rounded-md text-white cursor-pointer text-[12px] font-semibold px-[14px] py-[6px]">+ New Agent</button>
        </div>
      )}
    </div>
  )
}

function AgentListItem({
  agent, isSelected, onSelect, onDelete
}: {
  agent: Assistant
  isSelected: boolean | null | undefined
  onSelect: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`px-4 py-[10px] border-b border-[#18181b] cursor-pointer flex items-start gap-[10px] ${isSelected ? 'bg-white/[0.06]' : hovered ? 'bg-white/[0.03]' : 'bg-transparent'}`}
    >
      <span className="text-[22px] shrink-0 leading-[1.4]">{agent.emoji ?? '🤖'}</span>
      <div className="flex-1 overflow-hidden">
        <p className="text-[13px] text-[#fafafa] m-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium">
          {agent.name}
        </p>
        {agent.description && (
          <p className="text-[11px] text-[#52525b] mt-[2px] mb-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {agent.description}
          </p>
        )}
        {agent.prompt && (
          <p className="text-[10px] text-[#3f3f46] mt-[2px] mb-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {agent.prompt.slice(0, 50)}
          </p>
        )}
      </div>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="bg-transparent border-none text-[#71717a] cursor-pointer text-[12px] px-[4px] py-[2px] shrink-0"
          title="Delete agent"
        >
          ✕
        </button>
      )}
    </div>
  )
}

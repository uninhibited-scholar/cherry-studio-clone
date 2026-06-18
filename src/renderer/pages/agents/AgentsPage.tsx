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
    <div style={{ display: 'flex', height: '100%', background: '#09090b', color: '#fafafa' }}>
      {/* ── Agent list ── */}
      <aside style={{ width: 260, borderRight: '1px solid #27272a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #27272a' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>My Agents</span>
          <button
            onClick={startNew}
            style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px' }}
            title="New agent"
          >
            +
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {agents.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#52525b' }}>
              <p style={{ fontSize: 13 }}>No custom agents yet</p>
              <button onClick={startNew} style={{ marginTop: 12, ...btnPrimaryStyle }}>+ New Agent</button>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Editor header */}
          <div style={{ padding: '14px 24px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{isNew ? 'New Agent' : 'Edit Agent'}</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditing(null)} style={btnSecondaryStyle}>Cancel</button>
              <button onClick={handleSave} style={btnPrimaryStyle}>Save</button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {/* Emoji + Name */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Emoji</label>
                <select
                  value={editing.emoji ?? '🤖'}
                  onChange={(e) => setEditing((p) => ({ ...p, emoji: e.target.value }))}
                  style={{ ...inputStyle, width: 64, fontSize: 18, textAlign: 'center' }}
                >
                  {EMOJI_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Name *</label>
                <input
                  value={editing.name ?? ''}
                  onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Agent name"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Description */}
            <label style={labelStyle}>Description</label>
            <input
              value={editing.description ?? ''}
              onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))}
              placeholder="Short description of this agent's purpose"
              style={{ ...inputStyle, marginBottom: 16 }}
            />

            {/* System Prompt */}
            <label style={labelStyle}>System Prompt</label>
            <textarea
              value={editing.prompt ?? ''}
              onChange={(e) => setEditing((p) => ({ ...p, prompt: e.target.value }))}
              placeholder="You are a helpful assistant that…"
              rows={8}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'ui-monospace, monospace', marginBottom: 16 }}
            />

            {/* Provider + Model */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Default Provider</label>
                <select
                  value={editing.providerId ?? ''}
                  onChange={(e) => setEditing((p) => ({ ...p, providerId: e.target.value, modelId: undefined }))}
                  style={inputStyle}
                >
                  <option value="">— any —</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Default Model</label>
                <select
                  value={editing.modelId ?? ''}
                  onChange={(e) => setEditing((p) => ({ ...p, modelId: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">— any —</option>
                  {modelsForProvider.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            {/* Temperature */}
            <label style={labelStyle}>Temperature: {(editing.temperature ?? 1).toFixed(1)}</label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={editing.temperature ?? 1}
              onChange={(e) => setEditing((p) => ({ ...p, temperature: parseFloat(e.target.value) }))}
              style={{ width: '100%', marginBottom: 16 }}
            />

            {/* Max tokens */}
            <label style={labelStyle}>Max Tokens</label>
            <input
              type="number"
              value={editing.maxTokens ?? ''}
              onChange={(e) => setEditing((p) => ({ ...p, maxTokens: e.target.value ? parseInt(e.target.value) : undefined }))}
              placeholder="Unlimited"
              style={{ ...inputStyle, marginBottom: 16 }}
            />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#52525b' }}>
          <span style={{ fontSize: 56 }}>🤖</span>
          <p style={{ fontSize: 14, color: '#71717a' }}>Select an agent to edit, or create a new one</p>
          <button onClick={startNew} style={btnPrimaryStyle}>+ New Agent</button>
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
      style={{
        padding: '10px 16px',
        borderBottom: '1px solid #18181b',
        cursor: 'pointer',
        background: isSelected ? 'rgba(255,255,255,0.06)' : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.4 }}>{agent.emoji ?? '🤖'}</span>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{ fontSize: 13, color: '#fafafa', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {agent.name}
        </p>
        {agent.description && (
          <p style={{ fontSize: 11, color: '#52525b', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {agent.description}
          </p>
        )}
        {agent.prompt && (
          <p style={{ fontSize: 10, color: '#3f3f46', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {agent.prompt.slice(0, 50)}
          </p>
        )}
      </div>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 12, padding: '2px 4px', flexShrink: 0 }}
          title="Delete agent"
        >
          ✕
        </button>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#71717a', marginBottom: 4, marginTop: 0
}

const inputStyle: React.CSSProperties = {
  background: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: 6,
  color: '#fafafa',
  fontSize: 13,
  outline: 'none',
  padding: '6px 10px',
  width: '100%',
  boxSizing: 'border-box'
}

const btnPrimaryStyle: React.CSSProperties = {
  background: '#2563eb', border: 'none', borderRadius: 6, color: 'white',
  cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '6px 14px'
}

const btnSecondaryStyle: React.CSSProperties = {
  background: '#27272a', border: 'none', borderRadius: 6, color: '#a1a1aa',
  cursor: 'pointer', fontSize: 12, padding: '6px 14px'
}

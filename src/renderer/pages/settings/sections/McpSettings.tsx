import React, { useState, useEffect, useCallback } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { McpServer, McpTool } from '@shared/data/types/mcp'

export function McpSettings(): React.ReactElement {
  const [servers, setServers] = useState<McpServer[]>([])
  const [connected, setConnected] = useState<Set<string>>(new Set())
  const [tools, setTools] = useState<Record<string, McpTool[]>>({})
  const [editing, setEditing] = useState<Partial<McpServer> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [error, setError] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    const list = await window.api.invoke(IpcChannel.MCP_LIST) as McpServer[]
    setServers(list)
  }, [])

  useEffect(() => { load() }, [load])

  const handleConnect = async (server: McpServer) => {
    setError((p) => ({ ...p, [server.id]: '' }))
    try {
      await window.api.invoke(IpcChannel.MCP_CONNECT, server.id)
      setConnected((p) => new Set([...p, server.id]))
      const toolList = await window.api.invoke(IpcChannel.MCP_TOOLS, server.id) as McpTool[]
      setTools((p) => ({ ...p, [server.id]: toolList }))
    } catch (err: unknown) {
      setError((p) => ({ ...p, [server.id]: String(err) }))
    }
  }

  const handleDisconnect = async (serverId: string) => {
    await window.api.invoke(IpcChannel.MCP_DISCONNECT, serverId)
    setConnected((p) => { const s = new Set(p); s.delete(serverId); return s })
    setTools((p) => { const t = { ...p }; delete t[serverId]; return t })
  }

  const handleSave = async () => {
    if (!editing?.name?.trim()) return
    const saved = await window.api.invoke(IpcChannel.MCP_UPSERT, editing) as McpServer
    if (isNew) {
      setServers((p) => [saved, ...p])
    } else {
      setServers((p) => p.map((s) => s.id === saved.id ? saved : s))
    }
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (connected.has(id)) await handleDisconnect(id)
    await window.api.invoke(IpcChannel.MCP_DELETE, id)
    setServers((p) => p.filter((s) => s.id !== id))
    if (editing && (editing as McpServer).id === id) setEditing(null)
  }

  const startNew = () => {
    setEditing({ name: '', type: 'stdio', command: '', enabled: true })
    setIsNew(true)
  }

  return (
    <div style={{ color: '#fafafa' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>MCP Servers</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#71717a' }}>
            Model Context Protocol — connect external tools to your AI assistants
          </p>
        </div>
        <button onClick={startNew} style={btnPrimaryStyle}>+ Add Server</button>
      </div>

      {/* Editor */}
      {editing && (
        <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14 }}>{isNew ? 'New MCP Server' : 'Edit Server'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input value={editing.name ?? ''} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} placeholder="My Tool Server" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select value={editing.type ?? 'stdio'} onChange={(e) => setEditing((p) => ({ ...p, type: e.target.value as 'stdio' | 'sse' }))} style={inputStyle}>
                <option value="stdio">stdio (local process)</option>
                <option value="sse">SSE (remote URL)</option>
              </select>
            </div>
          </div>
          {editing.type === 'stdio' ? (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Command</label>
              <input value={editing.command ?? ''} onChange={(e) => setEditing((p) => ({ ...p, command: e.target.value }))} placeholder="npx -y @modelcontextprotocol/server-filesystem /tmp" style={inputStyle} />
              <p style={{ fontSize: 11, color: '#52525b', marginTop: 4 }}>Shell command to launch the MCP server process</p>
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>SSE URL</label>
              <input value={editing.url ?? ''} onChange={(e) => setEditing((p) => ({ ...p, url: e.target.value }))} placeholder="http://localhost:3000/sse" style={inputStyle} />
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Environment Variables (JSON)</label>
            <textarea
              value={editing.envJson ?? ''}
              onChange={(e) => setEditing((p) => ({ ...p, envJson: e.target.value }))}
              placeholder='{"API_KEY": "..."}'
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'ui-monospace, monospace' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={handleSave} style={btnPrimaryStyle}>Save</button>
            <button onClick={() => setEditing(null)} style={btnSecondaryStyle}>Cancel</button>
          </div>
        </div>
      )}

      {/* Server list */}
      {servers.length === 0 && !editing ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#52525b' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🔧</p>
          <p style={{ fontSize: 14, color: '#71717a' }}>No MCP servers configured</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>Add a server to give your AI assistant access to external tools</p>
          <button onClick={startNew} style={{ marginTop: 16, ...btnPrimaryStyle }}>+ Add First Server</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {servers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              isConnected={connected.has(server.id)}
              tools={tools[server.id]}
              error={error[server.id]}
              onConnect={() => handleConnect(server)}
              onDisconnect={() => handleDisconnect(server.id)}
              onEdit={() => { setEditing({ ...server }); setIsNew(false) }}
              onDelete={() => handleDelete(server.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ServerCard({
  server, isConnected, tools, error, onConnect, onDisconnect, onEdit, onDelete
}: {
  server: McpServer
  isConnected: boolean
  tools?: McpTool[]
  error?: string
  onConnect: () => void
  onDisconnect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ background: '#111113', border: `1px solid ${isConnected ? '#16a34a' : '#27272a'}`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#22c55e' : '#52525b', flexShrink: 0 }} />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{server.name}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {server.type === 'stdio' ? `stdio: ${server.command ?? '—'}` : `sse: ${server.url ?? '—'}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {isConnected ? (
            <>
              <button onClick={() => setExpanded((p) => !p)} style={btnSecondaryStyle}>
                {expanded ? 'Hide' : `Tools (${tools?.length ?? 0})`}
              </button>
              <button onClick={onDisconnect} style={{ ...btnSecondaryStyle, color: '#f87171' }}>Disconnect</button>
            </>
          ) : (
            <button onClick={onConnect} style={{ ...btnSecondaryStyle, borderColor: '#2563eb', color: '#60a5fa' }}>Connect</button>
          )}
          <button onClick={onEdit} style={btnSecondaryStyle}>Edit</button>
          <button onClick={onDelete} style={{ ...btnSecondaryStyle, color: '#f87171' }}>Delete</button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: '#450a0a', borderRadius: 6, fontSize: 11, color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {expanded && tools && tools.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tools.map((tool) => (
            <div key={tool.name} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: '6px 10px' }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#fafafa' }}>{tool.name}</p>
              {tool.description && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#71717a' }}>{tool.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, color: '#71717a', marginBottom: 4 }

const inputStyle: React.CSSProperties = {
  background: '#09090b', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa',
  fontSize: 13, outline: 'none', padding: '7px 10px', width: '100%', boxSizing: 'border-box'
}

const btnPrimaryStyle: React.CSSProperties = {
  background: '#2563eb', border: 'none', borderRadius: 6, color: 'white',
  cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '6px 14px'
}

const btnSecondaryStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid #3f3f46', borderRadius: 6, color: '#a1a1aa',
  cursor: 'pointer', fontSize: 12, padding: '5px 12px'
}

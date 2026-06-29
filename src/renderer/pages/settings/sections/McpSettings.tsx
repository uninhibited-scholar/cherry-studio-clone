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
    <div className="text-[#fafafa]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="m-0 text-[18px]">MCP Servers</h2>
          <p className="mt-1 mb-0 text-[12px] text-[#71717a]">
            Model Context Protocol — connect external tools to your AI assistants
          </p>
        </div>
        <button onClick={startNew} className={btnPrimaryCls}>+ Add Server</button>
      </div>

      {/* Editor */}
      {editing && (
        <div className="bg-[#18181b] border border-[#3f3f46] rounded-[10px] p-5 mb-5">
          <h3 className="mt-0 mb-4 text-[14px]">{isNew ? 'New MCP Server' : 'Edit Server'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Name *</label>
              <input value={editing.name ?? ''} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} placeholder="My Tool Server" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select value={editing.type ?? 'stdio'} onChange={(e) => setEditing((p) => ({ ...p, type: e.target.value as 'stdio' | 'sse' }))} className={inputCls}>
                <option value="stdio">stdio (local process)</option>
                <option value="sse">SSE (remote URL)</option>
              </select>
            </div>
          </div>
          {editing.type === 'stdio' ? (
            <div className="mt-3">
              <label className={labelCls}>Command</label>
              <input value={editing.command ?? ''} onChange={(e) => setEditing((p) => ({ ...p, command: e.target.value }))} placeholder="npx -y @modelcontextprotocol/server-filesystem /tmp" className={inputCls} />
              <p className="text-[11px] text-[#52525b] mt-1">Shell command to launch the MCP server process</p>
            </div>
          ) : (
            <div className="mt-3">
              <label className={labelCls}>SSE URL</label>
              <input value={editing.url ?? ''} onChange={(e) => setEditing((p) => ({ ...p, url: e.target.value }))} placeholder="http://localhost:3000/sse" className={inputCls} />
            </div>
          )}
          <div className="mt-3">
            <label className={labelCls}>Environment Variables (JSON)</label>
            <textarea
              value={editing.envJson ?? ''}
              onChange={(e) => setEditing((p) => ({ ...p, envJson: e.target.value }))}
              placeholder='{"API_KEY": "..."}'
              rows={2}
              className={`${inputCls} resize-y font-mono`}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className={btnPrimaryCls}>Save</button>
            <button onClick={() => setEditing(null)} className={btnSecondaryCls}>Cancel</button>
          </div>
        </div>
      )}

      {/* Server list */}
      {servers.length === 0 && !editing ? (
        <div className="text-center py-12 text-[#52525b]">
          <p className="text-[40px] mb-3">🔧</p>
          <p className="text-[14px] text-[#71717a]">No MCP servers configured</p>
          <p className="text-[12px] mt-[6px]">Add a server to give your AI assistant access to external tools</p>
          <button onClick={startNew} className={`mt-4 ${btnPrimaryCls}`}>+ Add First Server</button>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
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
    <div className={`bg-[#111113] rounded-[10px] p-4 border ${isConnected ? 'border-[#16a34a]' : 'border-[#27272a]'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-[#22c55e]' : 'bg-[#52525b]'}`} />
        <div className="flex-1 overflow-hidden">
          <p className="m-0 text-[14px] font-semibold">{server.name}</p>
          <p className="mt-[2px] mb-0 text-[11px] text-[#52525b] overflow-hidden text-ellipsis whitespace-nowrap">
            {server.type === 'stdio' ? `stdio: ${server.command ?? '—'}` : `sse: ${server.url ?? '—'}`}
          </p>
        </div>
        <div className="flex gap-[6px] shrink-0">
          {isConnected ? (
            <>
              <button onClick={() => setExpanded((p) => !p)} className={btnSecondaryCls}>
                {expanded ? 'Hide' : `Tools (${tools?.length ?? 0})`}
              </button>
              <button onClick={onDisconnect} className={`${btnSecondaryCls} text-[#f87171]`}>Disconnect</button>
            </>
          ) : (
            <button onClick={onConnect} className={`${btnSecondaryCls} border-[#2563eb] text-[#60a5fa]`}>Connect</button>
          )}
          <button onClick={onEdit} className={btnSecondaryCls}>Edit</button>
          <button onClick={onDelete} className={`${btnSecondaryCls} text-[#f87171]`}>Delete</button>
        </div>
      </div>

      {error && (
        <div className="mt-2 px-[10px] py-[6px] bg-[#450a0a] rounded-[6px] text-[11px] text-[#fca5a5]">
          {error}
        </div>
      )}

      {expanded && tools && tools.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tools.map((tool) => (
            <div key={tool.name} className="bg-[#18181b] border border-[#27272a] rounded-[6px] px-[10px] py-[6px]">
              <p className="m-0 text-[12px] font-semibold text-[#fafafa]">{tool.name}</p>
              {tool.description && <p className="mt-[2px] mb-0 text-[11px] text-[#71717a]">{tool.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const labelCls = 'block text-[11px] text-[#71717a] mb-1'

const inputCls = 'bg-[#09090b] border border-[#3f3f46] rounded-[6px] text-[#fafafa] text-[13px] outline-none px-[10px] py-[7px] w-full box-border'

const btnPrimaryCls = 'bg-[#2563eb] border-none rounded-[6px] text-white cursor-pointer text-[12px] font-semibold px-[14px] py-[6px]'

const btnSecondaryCls = 'bg-transparent border border-[#3f3f46] rounded-[6px] text-[#a1a1aa] cursor-pointer text-[12px] px-3 py-[5px]'

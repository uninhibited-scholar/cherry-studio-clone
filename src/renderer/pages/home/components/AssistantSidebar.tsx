import React, { useState, useRef, useEffect } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { Assistant, AssistantGroup } from '@shared/data/types/assistant'
import type { Topic } from '@shared/data/types/message'

type Props = {
  assistants: Assistant[]
  selectedAssistantId: string | null
  topics: Topic[]
  selectedTopicId: string | null
  onSelectAssistant: (a: Assistant) => void
  onSelectTopic: (t: Topic) => void
  onNewTopic: () => void
  onDeleteTopic: (id: string) => void
  onRenameTopicLocal: (id: string, title: string) => void
  onCreateAssistant: () => void
}

export function AssistantSidebar({
  assistants,
  selectedAssistantId,
  topics,
  selectedTopicId,
  onSelectAssistant,
  onSelectTopic,
  onNewTopic,
  onDeleteTopic,
  onRenameTopicLocal,
  onCreateAssistant
}: Props) {
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null)
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [search, setSearch] = useState('')
  const [groups, setGroups] = useState<AssistantGroup[]>([])
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; assistantId: string } | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroup, setShowNewGroup] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const newGroupRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setSearch('') }, [selectedAssistantId])

  useEffect(() => {
    window.api.invoke(IpcChannel.ASSISTANT_GROUPS_LIST).then((list) => setGroups(list as AssistantGroup[]))
  }, [])

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    const handler = () => setContextMenu(null)
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [contextMenu])

  useEffect(() => {
    if (showNewGroup && newGroupRef.current) newGroupRef.current.focus()
  }, [showNewGroup])

  useEffect(() => {
    if (editingTopicId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingTopicId])

  const q = search.trim().toLowerCase()
  const filteredAssistants = q ? assistants.filter((a) => a.name.toLowerCase().includes(q)) : assistants
  const filteredTopics = q ? topics.filter((t) => t.title.toLowerCase().includes(q)) : topics

  function startEdit(t: Topic) {
    setEditingTopicId(t.id)
    setEditValue(t.title)
  }

  async function commitEdit(id: string) {
    const title = editValue.trim()
    if (title) {
      await window.api.invoke(IpcChannel.TOPICS_UPDATE, { id, title })
      onRenameTopicLocal(id, title)
    }
    setEditingTopicId(null)
  }

  function cancelEdit() {
    setEditingTopicId(null)
  }

  function toggleGroup(groupId: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  async function createGroup() {
    const name = newGroupName.trim()
    if (!name) return
    const group = await window.api.invoke(IpcChannel.ASSISTANT_GROUPS_CREATE, name) as AssistantGroup
    setGroups((prev) => [...prev, group])
    setNewGroupName('')
    setShowNewGroup(false)
  }

  async function deleteGroup(id: string) {
    await window.api.invoke(IpcChannel.ASSISTANT_GROUPS_DELETE, id)
    setGroups((prev) => prev.filter((g) => g.id !== id))
  }

  async function moveToGroup(assistantId: string, groupId: string | null) {
    await window.api.invoke(IpcChannel.ASSISTANT_GROUPS_MOVE, { assistantId, groupId })
    // Refresh assistants list by updating local state — parent will need to reload
    // For now trigger a page reload of assistants via parent
    window.api.invoke(IpcChannel.ASSISTANTS_LIST).then(() => {
      // Parent component manages assistants state — we signal via a custom event
      window.dispatchEvent(new CustomEvent('cherry:reload-assistants'))
    })
    setContextMenu(null)
  }

  // Group assistants by groupId
  const ungrouped = filteredAssistants.filter((a) => !a.groupId)
  const groupedMap = new Map<string, Assistant[]>()
  for (const g of groups) groupedMap.set(g.id, [])
  for (const a of filteredAssistants) {
    if (a.groupId && groupedMap.has(a.groupId)) {
      groupedMap.get(a.groupId)!.push(a)
    }
  }

  function renderAssistantButton(a: Assistant) {
    return (
      <button
        key={a.id}
        onClick={() => onSelectAssistant(a)}
        onContextMenu={(e) => {
          e.preventDefault()
          setContextMenu({ x: e.clientX, y: e.clientY, assistantId: a.id })
        }}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg border-0 cursor-pointer text-sm text-left overflow-hidden transition-all duration-150"
        style={
          selectedAssistantId === a.id
            ? { background: 'rgba(147,51,234,0.18)', color: '#fafafa', boxShadow: '0 0 0 1px rgba(196,132,252,0.20)' }
            : { background: 'transparent', color: '#a1a1aa' }
        }
      >
        <span className="text-base">{a.emoji ?? '🤖'}</span>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{a.name}</span>
      </button>
    )
  }

  return (
    <aside className="w-full flex flex-col overflow-hidden" style={{ borderRight: '1px solid rgba(240,171,252,0.09)', background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }}>
      {/* Search */}
      <div className="px-2 pt-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full text-[#fafafa] text-xs outline-none px-2.5 py-[5px] rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(196,132,252,0.14)',
          }}
        />
      </div>

      {/* Assistants */}
      <div className="px-2 pt-2 pb-1 border-b border-b-[rgba(240,171,252,0.08)]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#71717a] font-semibold tracking-widest">ASSISTANTS</span>
          <button
            onClick={onCreateAssistant}
            title="New Assistant"
            className="bg-transparent border-0 text-[#71717a] cursor-pointer text-base leading-none px-0.5"
          >
            +
          </button>
        </div>
        <div className="max-h-[280px] overflow-y-auto">
          {/* Ungrouped assistants */}
          {ungrouped.length === 0 && groups.length === 0 && (
            <p className="text-[#52525b] text-xs px-2 py-1">{assistants.length === 0 ? 'No assistants yet' : 'No match'}</p>
          )}
          {ungrouped.map((a) => renderAssistantButton(a))}

          {/* Groups */}
          {groups.map((g) => {
            const members = groupedMap.get(g.id) ?? []
            const collapsed = collapsedGroups.has(g.id)
            return (
              <div key={g.id} className="mt-1">
                <div className="flex items-center gap-1 px-1">
                  <button
                    onClick={() => toggleGroup(g.id)}
                    className="flex-1 flex items-center gap-1 bg-transparent border-0 text-[#71717a] cursor-pointer text-[11px] text-left py-0.5"
                  >
                    <span>{collapsed ? '▶' : '▼'}</span>
                    <span className="font-semibold uppercase tracking-wider">{g.name}</span>
                    <span className="text-[#3f3f46]">({members.length})</span>
                  </button>
                  <button
                    onClick={() => deleteGroup(g.id)}
                    title="Delete group"
                    className="bg-transparent border-0 text-[#3f3f46] cursor-pointer text-[10px] px-0.5 hover:text-[#f87171]"
                  >
                    ✕
                  </button>
                </div>
                {!collapsed && members.map((a) => (
                  <div key={a.id} className="pl-3">
                    {renderAssistantButton(a)}
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* New group input / button */}
        {showNewGroup ? (
          <div className="flex gap-1 mt-1.5">
            <input
              ref={newGroupRef}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createGroup(); if (e.key === 'Escape') { setShowNewGroup(false); setNewGroupName('') } }}
              placeholder="Group name…"
              className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded text-[#fafafa] text-xs outline-none px-2 py-[4px]"
            />
            <button onClick={createGroup} className="bg-[#2563eb] border-none rounded text-white text-xs cursor-pointer px-2 py-[4px]">+</button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewGroup(true)}
            className="mt-1.5 w-full text-left bg-transparent border-0 text-[#52525b] text-[11px] cursor-pointer px-1 py-0.5 hover:text-[#a1a1aa]"
          >
            + New Group
          </button>
        )}
      </div>

      {/* Topics */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-2 pt-2.5 pb-1">
          <span className="text-xs text-[#71717a] font-semibold tracking-widest">TOPICS</span>
          {selectedAssistantId && (
            <button
              onClick={onNewTopic}
              title="New Topic"
              className="bg-transparent border-0 text-[#71717a] cursor-pointer text-base leading-none px-0.5"
            >
              +
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filteredTopics.length === 0 ? (
            <p className="text-[#52525b] text-xs py-1">
              {!selectedAssistantId ? 'Select an assistant' : topics.length === 0 ? 'No topics yet' : 'No match'}
            </p>
          ) : (
            filteredTopics.map((t) => (
              <div
                key={t.id}
                onMouseEnter={() => setHoveredTopic(t.id)}
                onMouseLeave={() => setHoveredTopic(null)}
                className="flex items-center rounded-lg transition-all duration-100"
                style={
                  selectedTopicId === t.id
                    ? { background: 'rgba(147,51,234,0.14)', boxShadow: '0 0 0 1px rgba(196,132,252,0.16)' }
                    : { background: 'transparent' }
                }
              >
                {editingTopicId === t.id ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit(t.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="flex-1 px-2 py-[5px] border border-[rgba(240,171,252,0.15)] rounded bg-[rgba(255,255,255,0.04)] text-[#fafafa] text-xs outline-none"
                  />
                ) : (
                  <button
                    onClick={() => onSelectTopic(t)}
                    onDoubleClick={() => startEdit(t)}
                    title="Double-click to rename"
                    className={`flex-1 px-2 py-1.5 border-0 bg-transparent cursor-pointer text-xs text-left overflow-hidden text-ellipsis whitespace-nowrap ${selectedTopicId === t.id ? 'text-[#fafafa]' : 'text-[#a1a1aa]'}`}
                  >
                    {t.title}
                  </button>
                )}
                {hoveredTopic === t.id && editingTopicId !== t.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteTopic(t.id) }}
                    className="bg-transparent border-0 text-[#71717a] cursor-pointer px-1.5 py-1 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Context menu: Move to group */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-lg py-1 shadow-2xl min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <p className="text-[10px] text-[#71717a] px-3 pt-1 pb-1 m-0 font-semibold uppercase tracking-wider">Move to group</p>
          <button
            onClick={() => moveToGroup(contextMenu.assistantId, null)}
            className="block w-full text-left px-3 py-1.5 border-0 bg-transparent text-[#a1a1aa] text-xs cursor-pointer hover:bg-white/[0.06]"
          >
            — Ungrouped
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => moveToGroup(contextMenu.assistantId, g.id)}
              className="block w-full text-left px-3 py-1.5 border-0 bg-transparent text-[#a1a1aa] text-xs cursor-pointer hover:bg-white/[0.06]"
            >
              {g.name}
            </button>
          ))}
          {groups.length === 0 && (
            <p className="text-[11px] text-[#52525b] px-3 py-1 m-0">No groups yet</p>
          )}
        </div>
      )}
    </aside>
  )
}

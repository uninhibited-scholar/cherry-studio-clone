import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useAssistants } from '../../hooks/useAssistants'
import { useTopics } from '../../hooks/useTopics'
import { useChat } from '../../hooks/useChat'
import { AssistantSidebar } from './components/AssistantSidebar'
import { MessageThread } from './components/MessageThread'
import { InputBar } from './components/InputBar'
import { CreateAssistantModal } from './components/CreateAssistantModal'
import { CommandPalette, type Command } from '../../components/CommandPalette'
import { IpcChannel } from '@shared/IpcChannel'
import { loadGeneralPrefs } from '../settings/sections/GeneralSettings'
import type { Assistant } from '@shared/data/types/assistant'
import type { Topic } from '@shared/data/types/message'

export function HomePage(): React.ReactElement {
  const { assistants, createAssistant } = useAssistants()
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [msgSearch, setMsgSearch] = useState('')
  const [showMsgSearch, setShowMsgSearch] = useState(false)
  const [draft, setDraft] = useState('')
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [sysPromptEdit, setSysPromptEdit] = useState(false)
  const [tempSysPrompt, setTempSysPrompt] = useState('')

  const importTopic = async () => {
    const file = await window.api.invoke(IpcChannel.FILE_SELECT, { filters: [{ name: 'JSON', extensions: ['json'] }] }) as string | null
    if (!file) return
    try {
      const content = await window.api.invoke(IpcChannel.FILE_READ, file) as string
      const data = JSON.parse(content) as { topic: Topic; messages: any[] }
      const newTopic = await createTopic()
      if (newTopic) {
        setSelectedTopic(newTopic)
        // Create messages in DB
        for (const msg of data.messages) {
          await window.api.invoke(IpcChannel.MESSAGES_CREATE, { topicId: newTopic.id, role: msg.role, content: msg.content, fileIds: msg.fileIds || [], usage: msg.usage })
        }
        // Refresh topic
        setSelectedTopic(newTopic)
      }
    } catch (e) {
      console.error('Failed to import topic:', e)
    }
  }

  const commands: Command[] = [
    { id: 'new-topic', label: 'New Topic', icon: '📝', onSelect: handleNewTopic },
    { id: 'new-assistant', label: 'New Assistant', icon: '🤖', onSelect: () => setShowCreateModal(true) },
    { id: 'import-topic', label: 'Import Topic', icon: '↑', onSelect: importTopic },
    selectedTopic ? { id: 'export-md', label: 'Export as Markdown', icon: '↓', onSelect: () => window.api.invoke(IpcChannel.EXPORT_TOPIC, selectedTopic.id) } : null,
    selectedTopic ? { id: 'export-json', label: 'Export as JSON', icon: '↓', onSelect: () => window.api.invoke(IpcChannel.EXPORT_TOPIC_JSON, { topic: selectedTopic, messages }) } : null,
    { id: 'settings', label: 'Settings', icon: '⚙️', onSelect: () => window.location.hash = '#/settings' }
  ].filter((c) => c !== null) as Command[]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdPaletteOpen((v) => !v)
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '<' || e.key === ',')) {
        e.preventDefault()
        const idx = assistants.findIndex((a) => a.id === selectedAssistant?.id)
        if (idx > 0) setSelectedAssistant(assistants[idx - 1])
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '>' || e.key === '.')) {
        e.preventDefault()
        const idx = assistants.findIndex((a) => a.id === selectedAssistant?.id)
        if (idx < assistants.length - 1) setSelectedAssistant(assistants[idx + 1])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [assistants, selectedAssistant])

  const getDraftKey = (topicId: string | null) => `cherry-clone:draft:${topicId}`

  useEffect(() => {
    if (selectedTopic) {
      const saved = localStorage.getItem(getDraftKey(selectedTopic.id))
      setDraft(saved ?? '')
    }
  }, [selectedTopic?.id])

  const saveDraft = (text: string) => {
    setDraft(text)
    if (selectedTopic) localStorage.setItem(getDraftKey(selectedTopic.id), text)
  }
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('cherry-clone:sidebar-width')
    return saved ? parseInt(saved) : 220
  })
  const dragRef = useRef<{ startX: number; startW: number } | null>(null)

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startW: sidebarWidth }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const w = Math.max(160, Math.min(400, dragRef.current.startW + ev.clientX - dragRef.current.startX))
      setSidebarWidth(w)
      localStorage.setItem('cherry-clone:sidebar-width', String(w))
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [sidebarWidth])

  const { topics, createTopic, deleteTopic, renameTopic } = useTopics(selectedAssistant?.id ?? null)
  const { messages, streaming, streamingText, searching, sendMessage, abort, deleteMessage, regenerate, editResend, selectedKnowledgeBaseId, setSelectedKnowledgeBaseId } = useChat(
    selectedTopic?.id ?? null,
    selectedAssistant
  )

  const handleSelectAssistant = useCallback(
    (a: Assistant) => {
      setSelectedAssistant(a)
      setSelectedTopic(null)
    },
    []
  )

  const handleSelectTopic = useCallback((t: Topic) => {
    setSelectedTopic(t)
  }, [])

  const handleNewTopic = useCallback(async () => {
    const t = await createTopic()
    if (t) setSelectedTopic(t)
  }, [createTopic])

  const handleDeleteTopic = useCallback(
    async (id: string) => {
      await deleteTopic(id)
      if (selectedTopic?.id === id) setSelectedTopic(null)
    },
    [deleteTopic, selectedTopic]
  )

  const handleCreateAssistant = useCallback(
    async (data: { name: string; emoji: string; prompt: string; providerId: string; modelId: string }) => {
      const a = await createAssistant({ ...data, temperature: 1 })
      setSelectedAssistant(a)
    },
    [createAssistant]
  )

  const canChat = Boolean(selectedTopic && selectedAssistant?.providerId && selectedAssistant?.modelId)
  const prefs = loadGeneralPrefs()

  // Handle menu events from main process
  useEffect(() => {
    const offNew = window.api.on(IpcChannel.MENU_NEW_TOPIC, () => {
      if (selectedAssistant) handleNewTopic()
    })
    const offExport = window.api.on(IpcChannel.MENU_EXPORT_TOPIC, () => {
      if (selectedTopic) window.api.invoke(IpcChannel.EXPORT_TOPIC, selectedTopic.id)
    })
    return () => { offNew(); offExport() }
  }, [selectedAssistant, selectedTopic, handleNewTopic])

  return (
    <>
      <CommandPalette commands={commands} isOpen={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />
      <div style={{ display: 'flex', height: '100%', background: '#09090b' }}>
      <div style={{ width: sidebarWidth, flexShrink: 0, display: 'flex' }}>
        <AssistantSidebar
          assistants={assistants}
          selectedAssistantId={selectedAssistant?.id ?? null}
          topics={topics}
          selectedTopicId={selectedTopic?.id ?? null}
          onSelectAssistant={handleSelectAssistant}
          onSelectTopic={handleSelectTopic}
          onNewTopic={handleNewTopic}
          onDeleteTopic={handleDeleteTopic}
          onRenameTopicLocal={renameTopic}
          onCreateAssistant={() => setShowCreateModal(true)}
        />
      </div>
      {/* Drag handle */}
      <div
        onMouseDown={onDividerMouseDown}
        style={{ width: 4, cursor: 'col-resize', background: 'transparent', flexShrink: 0, zIndex: 10 }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#3f3f46')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      />

      {/* Chat panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div
          style={{
            height: 48,
            borderBottom: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 10,
            flexShrink: 0
          }}
        >
          {selectedAssistant ? (
            <>
              <span style={{ fontSize: 18 }}>{selectedAssistant.emoji ?? '🤖'}</span>
              <span style={{ color: '#fafafa', fontSize: 14, fontWeight: 500 }}>{selectedAssistant.name}</span>
              {selectedTopic && (
                <>
                  <span style={{ color: '#52525b' }}>›</span>
                  <span style={{ color: '#71717a', fontSize: 13 }}>{selectedTopic.title}</span>
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#3f3f46' }}>
                    {messages.length} msg{messages.length !== 1 ? 's' : ''} · {messages.reduce((sum, m) => sum + m.content.split(/\s+/).filter(Boolean).length, 0)} words
                  </span>
                </>
              )}
              {selectedAssistant.modelId && (
                <span style={{ marginLeft: 4, fontSize: 11, color: '#3f3f46', background: '#18181b', border: '1px solid #27272a', borderRadius: 4, padding: '1px 7px' }}>
                  {selectedAssistant.modelId}
                </span>
              )}
            </>
          ) : (
            <span style={{ color: '#52525b', fontSize: 13 }}>Select an assistant to start</span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {showMsgSearch && selectedTopic && (
              <input
                autoFocus
                value={msgSearch}
                onChange={(e) => setMsgSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setShowMsgSearch(false); setMsgSearch('') } }}
                placeholder="Search messages…"
                style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa', fontSize: 12, outline: 'none', padding: '4px 10px', width: 200 }}
              />
            )}
            {selectedTopic && (
              <>
                <button
                  onClick={() => setSysPromptEdit((v) => !v)}
                  title="Edit system prompt for this conversation"
                  style={{ background: sysPromptEdit ? 'rgba(37,99,235,0.15)' : 'transparent', border: '1px solid #3f3f46', borderRadius: 6, color: sysPromptEdit ? '#60a5fa' : '#a1a1aa', cursor: 'pointer', fontSize: 13, padding: '3px 10px' }}
                >
                  📝
                </button>
                <button
                  onClick={() => { setShowMsgSearch((v) => !v); if (showMsgSearch) setMsgSearch('') }}
                  title="Search messages"
                  style={{ background: showMsgSearch ? 'rgba(37,99,235,0.15)' : 'transparent', border: '1px solid #3f3f46', borderRadius: 6, color: showMsgSearch ? '#60a5fa' : '#a1a1aa', cursor: 'pointer', fontSize: 13, padding: '3px 10px' }}
                >
                  🔍
                </button>
              </>
            )}
            {searching && (
              <span style={{ color: '#60a5fa', fontSize: 12 }}>🔍 Searching…</span>
            )}
            {selectedAssistant && (
              <button
                title="Import topic from JSON file"
                onClick={importTopic}
                style={{
                  background: 'transparent', border: '1px solid #3f3f46', borderRadius: 6,
                  color: '#a1a1aa', cursor: 'pointer', fontSize: 13, padding: '3px 10px'
                }}
              >
                ↑ Import
              </button>
            )}
            {selectedTopic && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  title="Export as Markdown"
                  onClick={() => window.api.invoke(IpcChannel.EXPORT_TOPIC, selectedTopic.id)}
                  style={{
                    background: 'transparent', border: '1px solid #3f3f46', borderRadius: 6,
                    color: '#a1a1aa', cursor: 'pointer', fontSize: 13, padding: '3px 10px'
                  }}
                >
                  ↓ Markdown
                </button>
                <button
                  title="Export as JSON with all messages"
                  onClick={() => window.api.invoke(IpcChannel.EXPORT_TOPIC_JSON, { topic: selectedTopic, messages })}
                  style={{
                    background: 'transparent', border: '1px solid #3f3f46', borderRadius: 6,
                    color: '#a1a1aa', cursor: 'pointer', fontSize: 13, padding: '3px 10px'
                  }}
                >
                  ↓ JSON
                </button>
                <button
                  title="Clear all messages in this topic"
                  onClick={() => {
                    if (confirm(`Delete all ${messages.length} messages in this topic?`)) {
                      Promise.all(messages.map((m) => deleteMessage(m.id)))
                    }
                  }}
                  style={{
                    background: 'transparent', border: '1px solid #7f1d1d', borderRadius: 6,
                    color: '#f87171', cursor: 'pointer', fontSize: 13, padding: '3px 10px'
                  }}
                >
                  🗑 Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedTopic ? (
          <>
            {sysPromptEdit && selectedAssistant && (
              <div style={{ background: '#18181b', borderBottom: '1px solid #27272a', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#fafafa' }}>System Prompt</span>
                  <button
                    onClick={async () => {
                      const text = tempSysPrompt || selectedAssistant.prompt || ''
                      if (text.trim()) {
                        const name = prompt('Save this prompt as:', 'My Prompt')
                        if (name) {
                          await window.api.invoke(IpcChannel.LIBRARY_CREATE, {
                            name: name.trim(), content: text, category: 'System Prompts'
                          })
                        }
                      }
                    }}
                    title="Save this system prompt to Library"
                    style={{ marginLeft: 'auto', fontSize: 11, background: 'none', border: '1px solid #3f3f46', color: '#a1a1aa', cursor: 'pointer', padding: '2px 8px', borderRadius: 4 }}
                  >
                    💾 Save
                  </button>
                  <button onClick={() => setSysPromptEdit(false)} style={{ fontSize: 11, background: 'none', border: 'none', color: '#52525b', cursor: 'pointer' }}>Close</button>
                </div>
                <textarea
                  value={tempSysPrompt || selectedAssistant.prompt || ''}
                  onChange={(e) => setTempSysPrompt(e.target.value)}
                  placeholder="System prompt (affects this conversation only)"
                  rows={3}
                  style={{ width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa', padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            )}
            <MessageThread
              messages={messages}
              streamingText={streamingText}
              streaming={streaming}
              onDelete={deleteMessage}
              onRegenerate={regenerate}
              onEditResend={editResend}
              showTimestamps={prefs.showTimestamps}
              searchQuery={msgSearch}
              autoScroll={prefs.autoScrollToBottom}
            />
            <InputBar
              onSend={(text, opts) => { sendMessage(text, opts); setDraft('') }}
              onAbort={abort}
              streaming={streaming}
              disabled={!canChat}
              selectedKnowledgeBaseId={selectedKnowledgeBaseId}
              onSelectKnowledgeBase={setSelectedKnowledgeBaseId}
              mcpTools={mcpTools}
              setMcpTools={setMcpTools}
              sendOnEnter={prefs.sendOnEnter}
              draftText={draft}
              onDraftChange={saveDraft}
            />
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#52525b'
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>🍒</div>
            <p style={{ fontSize: 16, color: '#71717a' }}>
              {selectedAssistant ? 'Create a new topic →' : 'Choose an assistant from the sidebar'}
            </p>
            {!selectedAssistant && (
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  marginTop: 16,
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#2563eb',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                + New Assistant
              </button>
            )}
            {selectedAssistant && (
              <button
                onClick={handleNewTopic}
                style={{
                  marginTop: 16,
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#2563eb',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                + New Topic
              </button>
            )}
          </div>
        )}
      </div>

      <CreateAssistantModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreateAssistant}
      />
      </div>
    </>
  )
}

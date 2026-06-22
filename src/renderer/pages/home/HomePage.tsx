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
  const [showStats, setShowStats] = useState(false)
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [quotedMessage, setQuotedMessage] = useState<any>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [topicSummary, setTopicSummary] = useState<string>('')
  const [showSharePanel, setShowSharePanel] = useState(false)

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

  const stats = (() => {
    if (!selectedTopic) return null
    const totalMessages = messages.length
    const userMessages = messages.filter((m) => m.role === 'user').length
    const assistantMessages = messages.filter((m) => m.role === 'assistant').length
    const totalWords = messages.reduce((sum, m) => sum + m.content.split(/\s+/).filter(Boolean).length, 0)
    const totalTokens = messages.reduce((sum, m) => sum + (m.usage?.inputTokens ?? 0) + (m.usage?.outputTokens ?? 0), 0)
    return { totalMessages, userMessages, assistantMessages, totalWords, totalTokens }
  })()

  // Load available models when showing menu
  useEffect(() => {
    if (showModelMenu && selectedAssistant) {
      window.api.invoke(IpcChannel.MODELS_LIST, selectedAssistant.providerId).then((models) => {
        setAvailableModels((models as any[]) || [])
      })
    }
  }, [showModelMenu, selectedAssistant])

  const generateSummary = async () => {
    if (!selectedAssistant || !messages.length) return
    setGeneratingSummary(true)
    try {
      const text = messages
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n')
      const requestId = `summary-${Date.now()}`
      const result = await window.api.invoke(IpcChannel.AI_CHAT, {
        requestId,
        providerId: selectedAssistant.providerId,
        modelId: selectedAssistant.modelId,
        messages: [
          {
            role: 'user',
            content: `Please provide a concise summary (2-3 sentences) of the following conversation:\n\n${text.slice(0, 2000)}`
          }
        ],
        temperature: 0.7
      }) as any
      setTopicSummary(result)
    } catch (e) {
      console.error('Failed to generate summary:', e)
    } finally {
      setGeneratingSummary(false)
    }
  }

  const exportAsFormat = (format: 'json' | 'markdown' | 'html') => {
    if (!selectedTopic) return

    let content = ''
    const filename = `${selectedTopic.title || 'export'}.${format}`

    if (format === 'json') {
      content = JSON.stringify({ topic: selectedTopic, messages }, null, 2)
    } else if (format === 'markdown') {
      content = `# ${selectedTopic.title || 'Conversation'}\n\n`
      content += `**Assistant:** ${selectedAssistant?.name}\n`
      content += `**Date:** ${new Date().toLocaleString()}\n\n`
      content += `---\n\n`
      messages.forEach((m) => {
        content += `## ${m.role === 'user' ? '👤 User' : '🤖 Assistant'}\n\n${m.content}\n\n`
      })
    } else if (format === 'html') {
      const htmlMessages = messages
        .map((m) => {
          const isUser = m.role === 'user'
          return `
        <div style="margin: 16px 0; padding: 12px; border-radius: 8px; background: ${isUser ? '#2563eb' : '#27272a'}; color: #fafafa;">
          <strong>${isUser ? '👤 You' : '🤖 Assistant'}</strong>
          <p style="margin: 8px 0 0; white-space: pre-wrap;">${m.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
      `
        })
        .join('')

      content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${selectedTopic.title || 'Conversation'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; background: #f5f5f5; }
          .container { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          h1 { margin: 0 0 8px; color: #09090b; }
          .meta { font-size: 14px; color: #666; margin: 12px 0 24px; border-bottom: 1px solid #eee; padding-bottom: 12px; }
          .message { margin: 16px 0; padding: 12px; border-radius: 8px; }
          .user-msg { background: #2563eb; color: white; }
          .ai-msg { background: #27272a; color: #fafafa; }
          strong { display: block; margin-bottom: 8px; }
          p { margin: 8px 0; white-space: pre-wrap; word-break: break-word; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${selectedTopic.title || 'Conversation'}</h1>
          <div class="meta">
            <strong>Assistant:</strong> ${selectedAssistant?.name || 'N/A'}<br>
            <strong>Messages:</strong> ${messages.length}<br>
            <strong>Exported:</strong> ${new Date().toLocaleString()}
          </div>
          ${htmlMessages}
        </div>
      </body>
      </html>
      `
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : format === 'markdown' ? 'text/markdown' : 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

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
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowModelMenu((v) => !v)}
                    style={{ marginLeft: 4, fontSize: 11, color: '#3f3f46', background: showModelMenu ? '#2563eb' : '#18181b', border: '1px solid #27272a', borderRadius: 4, padding: '1px 7px', cursor: 'pointer', color: showModelMenu ? '#fff' : '#3f3f46' }}
                  >
                    {selectedAssistant.modelId} ▼
                  </button>
                  {showModelMenu && (
                    <div style={{ position: 'absolute', top: 24, left: 0, background: '#18181b', border: '1px solid #27272a', borderRadius: 4, zIndex: 100, minWidth: 200, maxHeight: 300, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                      {availableModels.map((m) => (
                        <div
                          key={m.id}
                          onClick={async () => {
                            await window.api.invoke(IpcChannel.ASSISTANTS_UPSERT, { ...selectedAssistant, modelId: m.id })
                            setSelectedAssistant({ ...selectedAssistant, modelId: m.id })
                            setShowModelMenu(false)
                          }}
                          style={{ padding: '8px 12px', fontSize: 12, color: selectedAssistant.modelId === m.id ? '#60a5fa' : '#a1a1aa', background: selectedAssistant.modelId === m.id ? 'rgba(96,165,250,0.1)' : 'transparent', cursor: 'pointer', borderBottom: '1px solid #27272a' }}
                        >
                          {m.modelId === m.id ? '✓' : ' '} {m.displayName || m.id}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
            {selectedTopic && stats && (
              <>
                <button
                  onClick={() => setShowStats((v) => !v)}
                  title="Toggle statistics"
                  style={{ background: showStats ? 'rgba(37,99,235,0.15)' : 'transparent', border: '1px solid #3f3f46', borderRadius: 6, color: showStats ? '#60a5fa' : '#a1a1aa', cursor: 'pointer', fontSize: 13, padding: '3px 10px' }}
                >
                  📊 {stats.totalMessages}
                </button>
                <button
                  onClick={generateSummary}
                  disabled={generatingSummary || messages.length === 0}
                  title="Generate AI summary of this conversation"
                  style={{ background: 'transparent', border: '1px solid #3f3f46', borderRadius: 6, color: generatingSummary ? '#60a5fa' : '#a1a1aa', cursor: generatingSummary ? 'wait' : 'pointer', fontSize: 13, padding: '3px 10px', opacity: generatingSummary || messages.length === 0 ? 0.5 : 1 }}
                >
                  {generatingSummary ? '✨ …' : '✨ Summary'}
                </button>
              </>
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
              <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
                <div>
                  <button
                    title="Share and export this conversation"
                    onClick={() => setShowSharePanel((v) => !v)}
                    style={{
                      background: showSharePanel ? 'rgba(37,99,235,0.15)' : 'transparent', border: '1px solid #3f3f46', borderRadius: 6,
                      color: showSharePanel ? '#60a5fa' : '#a1a1aa', cursor: 'pointer', fontSize: 13, padding: '3px 10px'
                    }}
                  >
                    📤 Share
                  </button>
                  {showSharePanel && (
                    <div style={{ position: 'absolute', top: 32, right: 0, background: '#18181b', border: '1px solid #27272a', borderRadius: 8, zIndex: 100, minWidth: 180, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                      <button onClick={() => { exportAsFormat('json'); setShowSharePanel(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 12, background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', borderBottom: '1px solid #27272a' }}>📄 Export as JSON</button>
                      <button onClick={() => { exportAsFormat('markdown'); setShowSharePanel(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 12, background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', borderBottom: '1px solid #27272a' }}>📝 Export as Markdown</button>
                      <button onClick={() => { exportAsFormat('html'); setShowSharePanel(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 12, background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>🌐 Export as HTML</button>
                    </div>
                  )}
                </div>
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
            {topicSummary && selectedTopic && (
              <div style={{ background: '#18181b', borderBottom: '1px solid #27272a', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#fafafa' }}>✨ AI Summary</span>
                  <button onClick={() => setTopicSummary('')} style={{ marginLeft: 'auto', fontSize: 11, background: 'none', border: 'none', color: '#52525b', cursor: 'pointer' }}>Close</button>
                </div>
                <div style={{ fontSize: 13, color: '#e4e4e7', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{topicSummary}</div>
              </div>
            )}

            {showStats && stats && selectedTopic && (
              <div style={{ background: '#18181b', borderBottom: '1px solid #27272a', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#fafafa' }}>📊 Conversation Statistics</span>
                  <button onClick={() => setShowStats(false)} style={{ marginLeft: 'auto', fontSize: 11, background: 'none', border: 'none', color: '#52525b', cursor: 'pointer' }}>Close</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                  <div style={{ background: '#27272a', padding: '8px 12px', borderRadius: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#fafafa' }}>{stats.totalMessages}</div>
                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Total Messages</div>
                  </div>
                  <div style={{ background: '#27272a', padding: '8px 12px', borderRadius: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#60a5fa' }}>{stats.userMessages}</div>
                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Your Messages</div>
                  </div>
                  <div style={{ background: '#27272a', padding: '8px 12px', borderRadius: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#a78bfa' }}>{stats.assistantMessages}</div>
                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>AI Responses</div>
                  </div>
                  <div style={{ background: '#27272a', padding: '8px 12px', borderRadius: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#4ade80' }}>{stats.totalWords}</div>
                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Total Words</div>
                  </div>
                  <div style={{ background: '#27272a', padding: '8px 12px', borderRadius: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#fbbf24' }}>{stats.totalTokens}</div>
                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Total Tokens</div>
                  </div>
                </div>
              </div>
            )}

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
              onMultiDelete={(ids) => Promise.all(ids.map((id) => deleteMessage(id)))}
              onQuote={(msg) => setQuotedMessage(msg)}
            />
            {quotedMessage && (
              <div style={{ background: '#27272a', borderLeft: '3px solid #2563eb', padding: '8px 12px', marginBottom: 8, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, fontSize: 12, color: '#a1a1aa' }}>
                  <div style={{ color: '#71717a', fontSize: 11, marginBottom: 2 }}>Replying to {quotedMessage.role === 'user' ? 'your message' : 'assistant'}</div>
                  <div style={{ color: '#fafafa', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{quotedMessage.content.slice(0, 100)}{quotedMessage.content.length > 100 ? '…' : ''}</div>
                </div>
                <button
                  onClick={() => setQuotedMessage(null)}
                  style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 16 }}
                >
                  ✕
                </button>
              </div>
            )}
            <InputBar
              onSend={(text, opts) => { sendMessage(text, opts); setDraft(''); setQuotedMessage(null) }}
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

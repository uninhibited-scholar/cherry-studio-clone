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

  // Auto-select first assistant when list loads and nothing is selected
  useEffect(() => {
    if (!selectedAssistant && assistants.length > 0) {
      setSelectedAssistant(assistants[0])
    }
  }, [assistants, selectedAssistant])
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
    const paths = await window.api.invoke(IpcChannel.FILE_SELECT, { filters: [{ name: 'JSON', extensions: ['json'] }] }) as string[]
    const file = paths?.[0]
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
  const { messages, streaming, streamingText, searching, sendMessage, abort, deleteMessage, regenerate, editResend, selectedKnowledgeBaseId, setSelectedKnowledgeBaseId, mcpTools, setMcpTools } = useChat(
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

  const commands: Command[] = [
    { id: 'new-topic', label: 'New Topic', icon: '📝', onSelect: handleNewTopic },
    { id: 'new-assistant', label: 'New Assistant', icon: '🤖', onSelect: () => setShowCreateModal(true) },
    { id: 'import-topic', label: 'Import Topic', icon: '↑', onSelect: importTopic },
    selectedTopic ? { id: 'export-md', label: 'Export as Markdown', icon: '↓', onSelect: () => window.api.invoke(IpcChannel.EXPORT_TOPIC, selectedTopic.id) } : null,
    selectedTopic ? { id: 'export-json', label: 'Export as JSON', icon: '↓', onSelect: () => window.api.invoke(IpcChannel.EXPORT_TOPIC_JSON, { topic: selectedTopic, messages }) } : null,
    { id: 'settings', label: 'Settings', icon: '⚙️', onSelect: () => window.location.hash = '#/settings' }
  ].filter((c) => c !== null) as Command[]

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

  // Apply custom shortcuts
  useEffect(() => {
    const shortcuts = (() => {
      const saved = localStorage.getItem('cherry-clone:shortcuts')
      if (!saved) return null
      return JSON.parse(saved) as Record<string, string>
    })()

    if (!shortcuts) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // cmd-k: command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdPaletteOpen((v) => !v)
      }
      // cmd-n: new topic
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        if (selectedAssistant) handleNewTopic()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAssistant, handleNewTopic])

  const generateSummary = async () => {
    if (!selectedAssistant || !messages.length) return
    setGeneratingSummary(true)
    setTopicSummary('')
    try {
      const text = messages
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n')
      const requestId = `summary-${Date.now()}`
      await new Promise<void>((resolve, reject) => {
        const cleanup = window.api.on(IpcChannel.AI_STREAM_CHUNK, (payload: unknown) => {
          const { requestId: rid, chunk } = payload as { requestId: string; chunk: { type: string; text?: string; error?: string } }
          if (rid !== requestId) return
          if (chunk.type === 'text' && chunk.text) setTopicSummary((prev) => prev + chunk.text)
          if (chunk.type === 'done') { (cleanup as () => void)(); resolve() }
          if (chunk.type === 'error') { (cleanup as () => void)(); reject(new Error(chunk.error)) }
        })
        window.api.invoke(IpcChannel.AI_CHAT, {
          requestId,
          providerId: selectedAssistant.providerId,
          modelId: selectedAssistant.modelId,
          messages: [{ role: 'user', content: `Please provide a concise summary (2-3 sentences) of the following conversation:\n\n${text.slice(0, 2000)}` }],
          temperature: 0.7
        }).catch(reject)
      })
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
      <div className="flex h-full bg-[#09090b]">
      <div style={{ width: sidebarWidth }} className="shrink-0 flex">
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
        className="w-1 cursor-col-resize bg-transparent shrink-0 z-10"
        onMouseEnter={(e) => (e.currentTarget.style.background = '#3f3f46')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      />

      {/* Chat panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-12 border-b border-b-[#27272a] flex items-center px-4 gap-2.5 shrink-0">
          {selectedAssistant ? (
            <>
              <span className="text-lg">{selectedAssistant.emoji ?? '🤖'}</span>
              <span className="text-[#fafafa] text-sm font-medium">{selectedAssistant.name}</span>
              {selectedTopic && (
                <>
                  <span className="text-[#52525b]">›</span>
                  <span className="text-[#71717a] text-sm">{selectedTopic.title}</span>
                  <span className="ml-2 text-xs text-[#3f3f46]">
                    {messages.length} msg{messages.length !== 1 ? 's' : ''} · {messages.reduce((sum, m) => sum + m.content.split(/\s+/).filter(Boolean).length, 0)} words
                  </span>
                </>
              )}
              {selectedAssistant.modelId && (
                <div className="relative">
                  <button
                    onClick={() => setShowModelMenu((v) => !v)}
                    className={`ml-1 text-xs border border-[#27272a] rounded px-1.5 py-px cursor-pointer ${showModelMenu ? 'bg-[#2563eb] text-white' : 'bg-[#18181b] text-[#3f3f46]'}`}
                  >
                    {selectedAssistant.modelId?.includes('/') ? selectedAssistant.modelId.split('/').slice(1).join('/') : selectedAssistant.modelId} ▼
                  </button>
                  {showModelMenu && (
                    <div className="absolute top-6 left-0 bg-[#18181b] border border-[#27272a] rounded z-[100] min-w-[200px] max-h-[300px] overflow-y-auto shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                      {availableModels.map((m) => (
                        <div
                          key={m.id}
                          onClick={async () => {
                            await window.api.invoke(IpcChannel.ASSISTANTS_UPSERT, { ...selectedAssistant, modelId: m.id })
                            setSelectedAssistant({ ...selectedAssistant, modelId: m.id })
                            setShowModelMenu(false)
                          }}
                          className={`px-3 py-2 text-xs cursor-pointer border-b border-b-[#27272a] ${selectedAssistant.modelId === m.id ? 'text-[#60a5fa] bg-[rgba(96,165,250,0.1)]' : 'text-[#a1a1aa] bg-transparent'}`}
                        >
                          {selectedAssistant.modelId === m.id ? '✓' : ' '} {m.displayName || m.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <span className="text-[#52525b] text-sm">Select an assistant to start</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {showMsgSearch && selectedTopic && (
              <input
                autoFocus
                value={msgSearch}
                onChange={(e) => setMsgSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setShowMsgSearch(false); setMsgSearch('') } }}
                placeholder="Search messages…"
                className="bg-[#18181b] border border-[#3f3f46] rounded-md text-[#fafafa] text-xs outline-none px-2.5 py-1 w-[200px]"
              />
            )}
            {selectedTopic && (
              <>
                <button
                  onClick={() => setSysPromptEdit((v) => !v)}
                  title="Edit system prompt for this conversation"
                  className={`border border-[#3f3f46] rounded-md cursor-pointer text-sm px-2.5 py-[3px] ${sysPromptEdit ? 'bg-[rgba(37,99,235,0.15)] text-[#60a5fa]' : 'bg-transparent text-[#a1a1aa]'}`}
                >
                  📝
                </button>
                <button
                  onClick={() => { setShowMsgSearch((v) => !v); if (showMsgSearch) setMsgSearch('') }}
                  title="Search messages"
                  className={`border border-[#3f3f46] rounded-md cursor-pointer text-sm px-2.5 py-[3px] ${showMsgSearch ? 'bg-[rgba(37,99,235,0.15)] text-[#60a5fa]' : 'bg-transparent text-[#a1a1aa]'}`}
                >
                  🔍
                </button>
              </>
            )}
            {searching && (
              <span className="text-[#60a5fa] text-xs">🔍 Searching…</span>
            )}
            {selectedTopic && stats && (
              <>
                <button
                  onClick={() => setShowStats((v) => !v)}
                  title="Toggle statistics"
                  className={`border border-[#3f3f46] rounded-md cursor-pointer text-sm px-2.5 py-[3px] ${showStats ? 'bg-[rgba(37,99,235,0.15)] text-[#60a5fa]' : 'bg-transparent text-[#a1a1aa]'}`}
                >
                  📊 {stats.totalMessages}
                </button>
                <button
                  onClick={generateSummary}
                  disabled={generatingSummary || messages.length === 0}
                  title="Generate AI summary of this conversation"
                  className={`bg-transparent border border-[#3f3f46] rounded-md text-sm px-2.5 py-[3px] ${generatingSummary ? 'text-[#60a5fa] cursor-wait' : 'text-[#a1a1aa] cursor-pointer'} ${generatingSummary || messages.length === 0 ? 'opacity-50' : 'opacity-100'}`}
                >
                  {generatingSummary ? '✨ …' : '✨ Summary'}
                </button>
              </>
            )}
            {selectedAssistant && (
              <button
                title="Import topic from JSON file"
                onClick={importTopic}
                className="bg-transparent border border-[#3f3f46] rounded-md text-[#a1a1aa] cursor-pointer text-sm px-2.5 py-[3px]"
              >
                ↑ Import
              </button>
            )}
            {selectedTopic && (
              <div className="flex gap-1.5 relative">
                <div>
                  <button
                    title="Share and export this conversation"
                    onClick={() => setShowSharePanel((v) => !v)}
                    className={`border border-[#3f3f46] rounded-md cursor-pointer text-sm px-2.5 py-[3px] ${showSharePanel ? 'bg-[rgba(37,99,235,0.15)] text-[#60a5fa]' : 'bg-transparent text-[#a1a1aa]'}`}
                  >
                    📤 Share
                  </button>
                  {showSharePanel && (
                    <div className="absolute top-8 right-0 bg-[#18181b] border border-[#27272a] rounded-lg z-[100] min-w-[180px] shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                      <button onClick={() => { exportAsFormat('json'); setShowSharePanel(false) }} className="block w-full text-left px-3 py-2 text-xs bg-transparent border-0 border-b border-b-[#27272a] text-[#a1a1aa] cursor-pointer">📄 Export as JSON</button>
                      <button onClick={() => { exportAsFormat('markdown'); setShowSharePanel(false) }} className="block w-full text-left px-3 py-2 text-xs bg-transparent border-0 border-b border-b-[#27272a] text-[#a1a1aa] cursor-pointer">📝 Export as Markdown</button>
                      <button onClick={() => { exportAsFormat('html'); setShowSharePanel(false) }} className="block w-full text-left px-3 py-2 text-xs bg-transparent border-0 text-[#a1a1aa] cursor-pointer">🌐 Export as HTML</button>
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
                  className="bg-transparent border border-[#7f1d1d] rounded-md text-[#f87171] cursor-pointer text-sm px-2.5 py-[3px]"
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
              <div className="bg-[#18181b] border-b border-b-[#27272a] px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-[#fafafa]">✨ AI Summary</span>
                  <button onClick={() => setTopicSummary('')} className="ml-auto text-xs bg-transparent border-0 text-[#52525b] cursor-pointer">Close</button>
                </div>
                <div className="text-sm text-[#e4e4e7] leading-relaxed whitespace-pre-wrap break-words">{topicSummary}</div>
              </div>
            )}

            {showStats && stats && selectedTopic && (
              <div className="bg-[#18181b] border-b border-b-[#27272a] px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-[#fafafa]">📊 Conversation Statistics</span>
                  <button onClick={() => setShowStats(false)} className="ml-auto text-xs bg-transparent border-0 text-[#52525b] cursor-pointer">Close</button>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  <div className="bg-[#27272a] px-3 py-2 rounded-md text-center">
                    <div className="text-lg font-semibold text-[#fafafa]">{stats.totalMessages}</div>
                    <div className="text-xs text-[#71717a] mt-0.5">Total Messages</div>
                  </div>
                  <div className="bg-[#27272a] px-3 py-2 rounded-md text-center">
                    <div className="text-lg font-semibold text-[#60a5fa]">{stats.userMessages}</div>
                    <div className="text-xs text-[#71717a] mt-0.5">Your Messages</div>
                  </div>
                  <div className="bg-[#27272a] px-3 py-2 rounded-md text-center">
                    <div className="text-lg font-semibold text-[#a78bfa]">{stats.assistantMessages}</div>
                    <div className="text-xs text-[#71717a] mt-0.5">AI Responses</div>
                  </div>
                  <div className="bg-[#27272a] px-3 py-2 rounded-md text-center">
                    <div className="text-lg font-semibold text-[#4ade80]">{stats.totalWords}</div>
                    <div className="text-xs text-[#71717a] mt-0.5">Total Words</div>
                  </div>
                  <div className="bg-[#27272a] px-3 py-2 rounded-md text-center">
                    <div className="text-lg font-semibold text-[#fbbf24]">{stats.totalTokens}</div>
                    <div className="text-xs text-[#71717a] mt-0.5">Total Tokens</div>
                  </div>
                </div>
              </div>
            )}

            {sysPromptEdit && selectedAssistant && (
              <div className="bg-[#18181b] border-b border-b-[#27272a] px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-[#fafafa]">System Prompt</span>
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
                    className="ml-auto text-xs bg-transparent border border-[#3f3f46] text-[#a1a1aa] cursor-pointer px-2 py-0.5 rounded"
                  >
                    💾 Save
                  </button>
                  <button onClick={() => setSysPromptEdit(false)} className="text-xs bg-transparent border-0 text-[#52525b] cursor-pointer">Close</button>
                </div>
                <textarea
                  value={tempSysPrompt || selectedAssistant.prompt || ''}
                  onChange={(e) => setTempSysPrompt(e.target.value)}
                  placeholder="System prompt (affects this conversation only)"
                  rows={3}
                  className="w-full bg-[#27272a] border border-[#3f3f46] rounded-md text-[#fafafa] px-3 py-2 font-mono text-xs outline-none resize-y"
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
              <div className="bg-[#27272a] border-l-[3px] border-l-[#2563eb] px-3 py-2 mb-2 rounded flex items-center gap-2">
                <div className="flex-1 text-xs text-[#a1a1aa]">
                  <div className="text-[#71717a] text-xs mb-0.5">Replying to {quotedMessage.role === 'user' ? 'your message' : 'assistant'}</div>
                  <div className="text-[#fafafa] whitespace-pre-wrap break-words">{quotedMessage.content.slice(0, 100)}{quotedMessage.content.length > 100 ? '…' : ''}</div>
                </div>
                <button
                  onClick={() => setQuotedMessage(null)}
                  className="bg-transparent border-0 text-[#52525b] cursor-pointer text-base"
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
          <div className="flex-1 flex flex-col items-center justify-center text-[#52525b]">
            <div className="text-[56px] mb-4">🍒</div>
            <p className="text-base text-[#71717a]">
              {selectedAssistant ? 'Create a new topic →' : 'Choose an assistant from the sidebar'}
            </p>
            {!selectedAssistant && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-5 py-2.5 rounded-lg border-0 bg-[#2563eb] text-white cursor-pointer text-sm"
              >
                + New Assistant
              </button>
            )}
            {selectedAssistant && (
              <button
                onClick={handleNewTopic}
                className="mt-4 px-5 py-2.5 rounded-lg border-0 bg-[#2563eb] text-white cursor-pointer text-sm"
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

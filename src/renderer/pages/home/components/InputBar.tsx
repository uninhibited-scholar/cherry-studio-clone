import React, { useState, useRef, useCallback, useEffect } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { KnowledgeBase } from '@shared/data/types/knowledge'
import type { PromptTemplate } from '@shared/data/types/library'
import type { McpTool } from '@shared/data/types/mcp'

type Props = {
  onSend: (text: string, options: { webSearch: boolean }) => void
  onAbort: () => void
  streaming: boolean
  disabled: boolean
  selectedKnowledgeBaseId: string | null
  onSelectKnowledgeBase: (id: string | null) => void
  mcpTools: McpTool[]
  setMcpTools: (tools: McpTool[]) => void
  sendOnEnter?: boolean
  draftText?: string
  onDraftChange?: (text: string) => void
}

export function InputBar({ onSend, onAbort, streaming, disabled, selectedKnowledgeBaseId, onSelectKnowledgeBase, mcpTools, setMcpTools, sendOnEnter = true, draftText = '', onDraftChange }: Props) {
  const [text, setText] = useState(draftText)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  useEffect(() => {
    setText(draftText)
    setHistory([])
    setHistoryIndex(-1)
  }, [draftText])

  useEffect(() => {
    const timer = setTimeout(() => onDraftChange?.(text), 500)
    return () => clearTimeout(timer)
  }, [text, onDraftChange])

  const updateText = (newText: string) => {
    setText(newText)
    if (historyIndex >= 0) {
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newText)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    } else {
      setHistory([...history, newText])
      setHistoryIndex(history.length)
    }
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setText(history[newIndex])
      setHistoryIndex(newIndex)
    }
  }
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [showKbPicker, setShowKbPicker] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [showMcpPicker, setShowMcpPicker] = useState(false)
  const [allMcpTools, setAllMcpTools] = useState<McpTool[]>([])
  const [templateSearch, setTemplateSearch] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [quickReplies, setQuickReplies] = useState<string[]>(() => {
    const saved = localStorage.getItem('cherry-clone:quick-replies')
    return saved ? JSON.parse(saved) : ['👍', 'Thanks!', 'OK, got it', 'Can you elaborate?']
  })
  const kbRef = useRef<HTMLDivElement>(null)
  const tplRef = useRef<HTMLDivElement>(null)
  const mcpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.api.invoke(IpcChannel.KNOWLEDGE_LIST).then((list) => setKnowledgeBases(list as KnowledgeBase[]))
    window.api.invoke(IpcChannel.LIBRARY_LIST).then((list) => setTemplates(list as PromptTemplate[]))
    window.api.invoke(IpcChannel.MCP_LIST).then(async (servers: unknown) => {
      const svrs = servers as Array<{ id: string; name: string; isEnabled: boolean }>
      const connected = svrs.filter((s) => s.isEnabled)
      const toolLists = await Promise.all(
        connected.map((s) => window.api.invoke(IpcChannel.MCP_TOOLS, s.id).then((tools) => tools as McpTool[]).catch(() => []))
      )
      setAllMcpTools(toolLists.flat())
    })
  }, [])

  // Close pickers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showKbPicker && kbRef.current && !kbRef.current.contains(e.target as Node)) setShowKbPicker(false)
      if (showTemplatePicker && tplRef.current && !tplRef.current.contains(e.target as Node)) { setShowTemplatePicker(false); setTemplateSearch('') }
      if (showMcpPicker && mcpRef.current && !mcpRef.current.contains(e.target as Node)) setShowMcpPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showKbPicker, showTemplatePicker, showMcpPicker])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed, { webSearch: webSearchEnabled })
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [text, disabled, onSend, webSearchEnabled])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undo()
      } else if (e.key === 'Enter') {
        const shouldSend = sendOnEnter ? !e.shiftKey : e.shiftKey
        if (shouldSend) { e.preventDefault(); handleSend() }
      }
    },
    [handleSend, sendOnEnter, historyIndex, history]
  )

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  const insertTemplate = (tpl: PromptTemplate) => {
    setText(tpl.content)
    setShowTemplatePicker(false)
    setTemplateSearch('')
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        textareaRef.current.focus()
      }
    }, 50)
  }

  const toggleMcpTool = (tool: McpTool) => {
    const exists = mcpTools.some((t) => t.serverId === tool.serverId && t.name === tool.name)
    setMcpTools(exists ? mcpTools.filter((t) => !(t.serverId === tool.serverId && t.name === tool.name)) : [...mcpTools, tool])
  }

  const filteredTemplates = templates.filter(
    (t) => !templateSearch || t.title.toLowerCase().includes(templateSearch.toLowerCase()) || t.content.toLowerCase().includes(templateSearch.toLowerCase())
  )

  const selectedKb = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId)

  const pickerStyle: React.CSSProperties = {
    position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
    background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8,
    padding: 6, minWidth: 240, maxWidth: 340, zIndex: 50,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)', maxHeight: 320, overflowY: 'auto'
  }

  return (
    <div style={{ borderTop: '1px solid #27272a', padding: '12px 16px', background: '#09090b' }}>
      {/* Toolbar row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>

        {/* Web Search */}
        <ToolToggle active={webSearchEnabled} onClick={() => setWebSearchEnabled((v) => !v)} icon="🔍" label="Web" tooltip="Inject web search results as context" />

        {/* Knowledge base picker */}
        <div style={{ position: 'relative' }} ref={kbRef}>
          <ToolToggle active={!!selectedKnowledgeBaseId} onClick={() => setShowKbPicker((v) => !v)} icon="📚" label={selectedKb ? selectedKb.name : 'Knowledge'} tooltip="Attach a knowledge base" />
          {showKbPicker && (
            <div style={pickerStyle}>
              <p style={{ fontSize: 10, color: '#71717a', padding: '2px 8px 6px', margin: 0 }}>KNOWLEDGE BASE</p>
              <PickerItem active={!selectedKnowledgeBaseId} onClick={() => { onSelectKnowledgeBase(null); setShowKbPicker(false) }}>None</PickerItem>
              {knowledgeBases.length === 0 && <p style={{ fontSize: 11, color: '#52525b', padding: '4px 10px', margin: 0 }}>No knowledge bases yet</p>}
              {knowledgeBases.map((kb) => (
                <PickerItem key={kb.id} active={selectedKnowledgeBaseId === kb.id} onClick={() => { onSelectKnowledgeBase(kb.id); setShowKbPicker(false) }}>
                  📚 {kb.name} <span style={{ color: '#52525b' }}>({kb.documentCount})</span>
                </PickerItem>
              ))}
            </div>
          )}
        </div>

        {/* Prompt template picker */}
        <div style={{ position: 'relative' }} ref={tplRef}>
          <ToolToggle active={showTemplatePicker} onClick={() => { setShowTemplatePicker((v) => !v); setTemplateSearch('') }} icon="📋" label="Templates" tooltip="Insert a prompt template" />
          {showTemplatePicker && (
            <div style={pickerStyle}>
              <p style={{ fontSize: 10, color: '#71717a', padding: '2px 8px 4px', margin: 0 }}>PROMPT TEMPLATES</p>
              <input
                autoFocus
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Search templates…"
                style={{ width: '100%', background: '#27272a', border: 'none', borderRadius: 6, color: '#fafafa', fontSize: 12, outline: 'none', padding: '5px 8px', boxSizing: 'border-box', marginBottom: 4 }}
              />
              {filteredTemplates.length === 0 && <p style={{ fontSize: 11, color: '#52525b', padding: '4px 10px', margin: 0 }}>No templates found</p>}
              {filteredTemplates.map((t) => (
                <PickerItem key={t.id} active={false} onClick={() => insertTemplate(t)}>
                  <span style={{ fontWeight: 500 }}>{t.title}</span>
                  <span style={{ color: '#52525b', fontSize: 11, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.content.slice(0, 60)}…
                  </span>
                </PickerItem>
              ))}
            </div>
          )}
        </div>

        {/* MCP tools picker */}
        {allMcpTools.length > 0 && (
          <div style={{ position: 'relative' }} ref={mcpRef}>
            <ToolToggle active={mcpTools.length > 0} onClick={() => setShowMcpPicker((v) => !v)} icon="🔧" label={mcpTools.length > 0 ? `${mcpTools.length} tool${mcpTools.length > 1 ? 's' : ''}` : 'MCP Tools'} tooltip="Select MCP tools to include" />
            {showMcpPicker && (
              <div style={pickerStyle}>
                <p style={{ fontSize: 10, color: '#71717a', padding: '2px 8px 6px', margin: 0 }}>MCP TOOLS</p>
                {allMcpTools.map((tool) => {
                  const active = mcpTools.some((t) => t.serverId === tool.serverId && t.name === tool.name)
                  return (
                    <PickerItem key={`${tool.serverId}:${tool.name}`} active={active} onClick={() => toggleMcpTool(tool)}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12 }}>{active ? '✓' : '○'}</span>
                        <span>
                          <span style={{ fontWeight: 500 }}>{tool.name}</span>
                          {tool.description && <span style={{ color: '#52525b', fontSize: 11, display: 'block' }}>{tool.description.slice(0, 60)}</span>}
                        </span>
                      </span>
                    </PickerItem>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input row */}
      <div
        style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, padding: '8px 12px' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault()
          const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('text/') || f.name.match(/\.(md|txt|json|csv|yaml|yml|html|xml)$/i))
          if (files.length === 0) return
          const contents = await Promise.all(files.map((f) => f.text()))
          const appended = contents.map((c, i) => `[File: ${files[i].name}]\n${c}`).join('\n\n')
          setText((prev) => prev ? `${prev}\n\n${appended}` : appended)
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto'
              textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
            }
          }, 0)
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Configure an assistant with a provider and model first…' : 'Message… (Enter to send, Shift+Enter for newline, drag .txt/.md to attach)'}
          rows={1}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fafafa', fontSize: 14, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit', overflowY: 'hidden', minHeight: 24, maxHeight: 200 }}
        />
        <button
          onClick={streaming ? onAbort : handleSend}
          disabled={!streaming && (disabled || !text.trim())}
          title={streaming ? 'Stop' : 'Send'}
          style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            cursor: streaming || (!disabled && text.trim()) ? 'pointer' : 'default',
            background: streaming ? '#dc2626' : '#2563eb',
            color: 'white', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            opacity: !streaming && (disabled || !text.trim()) ? 0.4 : 1,
            transition: 'opacity 0.15s, background 0.15s'
          }}
        >
          {streaming ? '⏹' : '↑'}
        </button>
      </div>

      {/* Quick replies */}
      {quickReplies.length > 0 && !disabled && (
        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {quickReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => updateText(reply)}
              title={`Quick reply: ${reply}`}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #3f3f46',
                background: 'transparent', color: '#a1a1aa', cursor: 'pointer', transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(37,99,235,0.1)'
                e.currentTarget.style.color = '#60a5fa'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#a1a1aa'
              }}
            >
              {reply.length > 20 ? reply.slice(0, 17) + '…' : reply}
            </button>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: '#52525b', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span>Enter to send · Shift+Enter for newline{webSearchEnabled ? ' · 🔍 Web on' : ''}{selectedKb ? ` · 📚 ${selectedKb.name}` : ''}{mcpTools.length > 0 ? ` · 🔧 ${mcpTools.length} tool${mcpTools.length > 1 ? 's' : ''}` : ''}</span>
        <span style={{ color: '#3f3f46' }}>{text.length > 0 ? `${text.length}` : ''}</span>
      </p>
    </div>
  )
}

function PickerItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px',
        background: active ? 'rgba(37,99,235,0.2)' : 'transparent',
        border: 'none', borderRadius: 6,
        color: active ? '#60a5fa' : '#fafafa',
        cursor: 'pointer', fontSize: 12, marginBottom: 2
      }}
    >
      {children}
    </button>
  )
}

function ToolToggle({ active, onClick, icon, label, tooltip }: { active: boolean; onClick: () => void; icon: string; label: string; tooltip: string }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 6,
        border: `1px solid ${active ? '#2563eb' : '#3f3f46'}`,
        background: active ? 'rgba(37,99,235,0.15)' : 'transparent',
        color: active ? '#60a5fa' : '#71717a',
        cursor: 'pointer', fontSize: 12, transition: 'all 0.15s',
        maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
      }}
    >
      <span>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    </button>
  )
}

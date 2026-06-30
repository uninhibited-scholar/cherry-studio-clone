import React, { useState, useRef, useCallback, useEffect } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { KnowledgeBase } from '@shared/data/types/knowledge'
import type { PromptTemplate } from '@shared/data/types/library'
import type { McpTool } from '@shared/data/types/mcp'
import { useVoiceInput } from '../../../hooks/useVoiceInput'
import { parseVariables } from '@shared/utils/promptTemplate'
import { TemplateVariableDialog } from '@renderer/components/TemplateVariableDialog'

type Props = {
  onSend: (text: string, options: { webSearch: boolean; images?: Array<{name: string; dataUrl: string}> }) => void
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
  const [attachments, setAttachments] = useState<Array<{name: string; type: 'image'|'text'; dataUrl?: string; text?: string}>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { isListening, startListening, stopListening, isSupported: voiceSupported } = useVoiceInput((transcript) => {
    setText((prev) => prev ? `${prev} ${transcript}` : transcript)
  })
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
  const [variableDialogTemplate, setVariableDialogTemplate] = useState<PromptTemplate | null>(null)
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
    if (!trimmed && attachments.length === 0) return
    if (disabled) return

    let fullText = trimmed
    const textFiles = attachments.filter(a => a.type === 'text')
    if (textFiles.length > 0) {
      fullText += '\n\n' + textFiles.map(a => `[File: ${a.name}]\n${a.text}`).join('\n\n')
    }
    const imageAttachments = attachments.filter(a => a.type === 'image').map(a => ({ name: a.name, dataUrl: a.dataUrl! }))

    onSend(fullText, { webSearch: webSearchEnabled, images: imageAttachments.length > 0 ? imageAttachments : undefined })
    setText('')
    setAttachments([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [text, attachments, disabled, onSend, webSearchEnabled])

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

  const applyTemplateContent = (content: string) => {
    setText(content)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        textareaRef.current.focus()
      }
    }, 50)
  }

  const insertTemplate = (tpl: PromptTemplate) => {
    setShowTemplatePicker(false)
    setTemplateSearch('')
    const vars = parseVariables(tpl.content)
    if (vars.length > 0) {
      setVariableDialogTemplate(tpl)
    } else {
      applyTemplateContent(tpl.content)
    }
  }

  const toggleMcpTool = (tool: McpTool) => {
    const exists = mcpTools.some((t) => t.serverId === tool.serverId && t.name === tool.name)
    setMcpTools(exists ? mcpTools.filter((t) => !(t.serverId === tool.serverId && t.name === tool.name)) : [...mcpTools, tool])
  }

  const filteredTemplates = templates.filter(
    (t) => !templateSearch || t.title.toLowerCase().includes(templateSearch.toLowerCase()) || t.content.toLowerCase().includes(templateSearch.toLowerCase())
  )

  const selectedKb = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId)

  const pickerClass = 'absolute bottom-full left-0 mb-1.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-lg p-1.5 min-w-[240px] max-w-[340px] z-50 max-h-[320px] overflow-y-auto'
  const pickerShadow = { boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(196,132,252,0.12)' }

  return (
    <div
      className="px-4 py-3"
      style={{
        borderTop: '1px solid rgba(196,132,252,0.10)',
        background: 'rgba(10,0,20,0.55)',
        backdropFilter: 'blur(24px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
      }}
    >
      {variableDialogTemplate && (
        <TemplateVariableDialog
          template={variableDialogTemplate.content}
          onFill={(result) => { setVariableDialogTemplate(null); applyTemplateContent(result) }}
          onClose={() => setVariableDialogTemplate(null)}
        />
      )}
      {/* Toolbar row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">

        {/* Web Search */}
        <ToolToggle active={webSearchEnabled} onClick={() => setWebSearchEnabled((v) => !v)} icon="🔍" label="Web" tooltip="Inject web search results as context" />

        {/* Knowledge base picker */}
        <div className="relative" ref={kbRef}>
          <ToolToggle active={!!selectedKnowledgeBaseId} onClick={() => setShowKbPicker((v) => !v)} icon="📚" label={selectedKb ? selectedKb.name : 'Knowledge'} tooltip="Attach a knowledge base" />
          {showKbPicker && (
            <div className={pickerClass} style={pickerShadow}>
              <p className="text-[10px] text-[#71717a] px-2 pt-0.5 pb-1.5 m-0">KNOWLEDGE BASE</p>
              <PickerItem active={!selectedKnowledgeBaseId} onClick={() => { onSelectKnowledgeBase(null); setShowKbPicker(false) }}>None</PickerItem>
              {knowledgeBases.length === 0 && <p className="text-[11px] text-[#52525b] px-2.5 py-1 m-0">No knowledge bases yet</p>}
              {knowledgeBases.map((kb) => (
                <PickerItem key={kb.id} active={selectedKnowledgeBaseId === kb.id} onClick={() => { onSelectKnowledgeBase(kb.id); setShowKbPicker(false) }}>
                  📚 {kb.name} <span className="text-[#52525b]">({kb.documentCount})</span>
                </PickerItem>
              ))}
            </div>
          )}
        </div>

        {/* Prompt template picker */}
        <div className="relative" ref={tplRef}>
          <ToolToggle active={showTemplatePicker} onClick={() => { setShowTemplatePicker((v) => !v); setTemplateSearch('') }} icon="📋" label="Templates" tooltip="Insert a prompt template" />
          {showTemplatePicker && (
            <div className={pickerClass} style={pickerShadow}>
              <p className="text-[10px] text-[#71717a] px-2 pt-0.5 pb-1 m-0">PROMPT TEMPLATES</p>
              <input
                autoFocus
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Search templates…"
                className="w-full bg-[#27272a] border-0 rounded-md text-[#fafafa] text-xs outline-none px-2 py-[5px] box-border mb-1"
              />
              {filteredTemplates.length === 0 && <p className="text-[11px] text-[#52525b] px-2.5 py-1 m-0">No templates found</p>}
              {filteredTemplates.map((t) => (
                <PickerItem key={t.id} active={false} onClick={() => insertTemplate(t)}>
                  <span className="font-medium">{t.title}</span>
                  <span className="text-[#52525b] text-[11px] block overflow-hidden text-ellipsis whitespace-nowrap">
                    {t.content.slice(0, 60)}…
                  </span>
                </PickerItem>
              ))}
            </div>
          )}
        </div>

        {/* File attachment */}
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.md,.json,.csv,.xml,.yaml,.yml"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const files = Array.from(e.target.files || [])
              const loaded = await Promise.all(files.map(async (f) => {
                if (f.type.startsWith('image/')) {
                  return new Promise<{name:string;type:'image';dataUrl:string}>((res) => {
                    const r = new FileReader()
                    r.onload = () => res({ name: f.name, type: 'image', dataUrl: r.result as string })
                    r.readAsDataURL(f)
                  })
                } else {
                  const text = await f.text()
                  return { name: f.name, type: 'text' as const, text }
                }
              }))
              setAttachments(prev => [...prev, ...loaded])
              e.target.value = ''
            }}
          />
          <ToolToggle
            active={attachments.length > 0}
            onClick={() => fileInputRef.current?.click()}
            icon="📎"
            label={attachments.length > 0 ? `${attachments.length} file${attachments.length>1?'s':''}` : 'Attach'}
            tooltip="Attach images or text files"
          />
        </>

        {/* MCP tools picker */}
        {allMcpTools.length > 0 && (
          <div className="relative" ref={mcpRef}>
            <ToolToggle active={mcpTools.length > 0} onClick={() => setShowMcpPicker((v) => !v)} icon="🔧" label={mcpTools.length > 0 ? `${mcpTools.length} tool${mcpTools.length > 1 ? 's' : ''}` : 'MCP Tools'} tooltip="Select MCP tools to include" />
            {showMcpPicker && (
              <div className={pickerClass} style={pickerShadow}>
                <p className="text-[10px] text-[#71717a] px-2 pt-0.5 pb-1.5 m-0">MCP TOOLS</p>
                {allMcpTools.map((tool) => {
                  const active = mcpTools.some((t) => t.serverId === tool.serverId && t.name === tool.name)
                  return (
                    <PickerItem key={`${tool.serverId}:${tool.name}`} active={active} onClick={() => toggleMcpTool(tool)}>
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs">{active ? '✓' : '○'}</span>
                        <span>
                          <span className="font-medium">{tool.name}</span>
                          {tool.description && <span className="text-[#52525b] text-[11px] block">{tool.description.slice(0, 60)}</span>}
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

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2">
          {attachments.map((a, i) => (
            <div key={i} className="relative flex items-center gap-1.5 bg-[rgba(255,255,255,0.06)] border border-[rgba(196,132,252,0.2)] rounded-lg px-2 py-1">
              {a.type === 'image' ? (
                <img src={a.dataUrl} alt={a.name} className="h-10 w-10 object-cover rounded" />
              ) : (
                <span className="text-xs">📄</span>
              )}
              <span className="text-[11px] text-[#a1a1aa] max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">{a.name}</span>
              <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="text-[#52525b] hover:text-[#ef4444] text-xs border-0 bg-transparent cursor-pointer leading-none ml-0.5">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        className="flex items-end gap-2 rounded-2xl px-3 py-2"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(196,132,252,0.20)',
          boxShadow: '0 0 0 3px rgba(147,51,234,0.07), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
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
          className="flex-1 bg-transparent border-0 outline-none text-[#fafafa] text-sm leading-[1.6] resize-none font-[inherit] overflow-y-hidden min-h-6 max-h-[200px]"
        />
        {voiceSupported && (
          <button
            onClick={isListening ? stopListening : startListening}
            title={isListening ? 'Stop recording' : 'Voice input'}
            className={`w-8 h-8 rounded-lg border-0 flex items-center justify-center shrink-0 text-sm transition-[opacity,background] duration-150 cursor-pointer ${isListening ? 'bg-[#dc2626] text-white' : 'bg-[#27272a] text-[#a1a1aa]'}`}
          >
            {isListening ? (
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#fff', animation: 'blink 1s step-end infinite' }} />
            ) : '🎤'}
          </button>
        )}
        <button
          onClick={streaming ? onAbort : handleSend}
          disabled={!streaming && (disabled || (!text.trim() && attachments.length === 0))}
          title={streaming ? 'Stop' : 'Send'}
          className={`w-8 h-8 rounded-xl border-0 flex items-center justify-center shrink-0 text-sm text-white transition-all duration-150 ${!streaming && (disabled || !text.trim()) ? 'opacity-35 cursor-default' : 'cursor-pointer'}`}
          style={{
            background: streaming ? '#dc2626' : 'linear-gradient(135deg, #7c3aed, #d946ef)',
            boxShadow: (!streaming && (disabled || (!text.trim() && attachments.length === 0))) ? 'none' : '0 0 12px rgba(196,132,252,0.40)',
          }}
        >
          {streaming ? '⏹' : '↑'}
        </button>
      </div>

      {/* Quick replies */}
      {quickReplies.length > 0 && !disabled && (
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {quickReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => updateText(reply)}
              title={`Quick reply: ${reply}`}
              className="text-[11px] px-2.5 py-1 rounded-md border border-[rgba(240,171,252,0.15)] bg-transparent text-[#a1a1aa] cursor-pointer transition-all duration-150 hover:bg-[rgba(37,99,235,0.1)] hover:text-[#60a5fa]"
            >
              {reply.length > 20 ? reply.slice(0, 17) + '…' : reply}
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px] text-[#52525b] mt-1.5 flex justify-between">
        <span>Enter to send · Shift+Enter for newline{webSearchEnabled ? ' · 🔍 Web on' : ''}{selectedKb ? ` · 📚 ${selectedKb.name}` : ''}{mcpTools.length > 0 ? ` · 🔧 ${mcpTools.length} tool${mcpTools.length > 1 ? 's' : ''}` : ''}</span>
        <span className="text-[#3f3f46]">{text.length > 0 ? `${text.length}` : ''}</span>
      </p>
    </div>
  )
}

function PickerItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-2.5 py-1.5 border-0 rounded-md cursor-pointer text-xs mb-0.5 ${active ? 'bg-[rgba(37,99,235,0.2)] text-[#60a5fa]' : 'bg-transparent text-[#fafafa]'}`}
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
      className={`flex items-center gap-1 px-2.5 py-1 rounded-md border cursor-pointer text-xs transition-all duration-150 max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap ${active ? 'border-[#2563eb] bg-[rgba(37,99,235,0.15)] text-[#60a5fa]' : 'border-[#3f3f46] bg-transparent text-[#71717a]'}`}
    >
      <span>{icon}</span>
      <span className="overflow-hidden text-ellipsis">{label}</span>
    </button>
  )
}

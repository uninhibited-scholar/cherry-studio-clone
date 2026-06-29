import { useState, useEffect, useCallback, useRef } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { Message } from '@shared/data/types/message'
import type { Assistant } from '@shared/data/types/assistant'
import type { McpTool } from '@shared/data/types/mcp'

type StreamChunk =
  | { type: 'text'; text: string }
  | { type: 'done'; usage?: { inputTokens: number; outputTokens: number } }
  | { type: 'error'; error: string }

type SearchResult = { title: string; url: string; snippet: string }

export function useChat(topicId: string | null, assistant: Assistant | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [searching, setSearching] = useState(false)
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<string | null>(null)
  const [mcpTools, setMcpTools] = useState<McpTool[]>([])
  const requestIdRef = useRef<string | null>(null)
  const streamingTextRef = useRef('')
  const firstUserMsgRef = useRef<string>('')

  useEffect(() => { streamingTextRef.current = streamingText }, [streamingText])

  useEffect(() => {
    if (!topicId) { setMessages([]); return }
    window.api.invoke(IpcChannel.MESSAGES_LIST, topicId).then((list) => {
      setMessages(list as Message[])
    })
    setMcpTools([])
  }, [topicId])

  useEffect(() => {
    const unsub = window.api.on(IpcChannel.AI_STREAM_CHUNK, (payload: unknown) => {
      const { requestId, chunk } = payload as { requestId: string; chunk: StreamChunk }
      if (requestId !== requestIdRef.current) return

      if (chunk.type === 'text') {
        setStreamingText((prev) => prev + chunk.text)
      } else if (chunk.type === 'done') {
        finalizeStream(chunk.usage)
      } else if (chunk.type === 'error') {
        finalizeStream(undefined, chunk.error)
      }
    })
    return unsub
  }, [topicId, assistant]) // eslint-disable-line react-hooks/exhaustive-deps

  const finalizeStream = useCallback(
    (usage?: { inputTokens: number; outputTokens: number }, error?: string) => {
      const text = streamingTextRef.current
      setStreamingText('')
      setStreaming(false)
      requestIdRef.current = null

      if (!topicId) return

      // Record API statistics
      const stats = (() => {
        const saved = localStorage.getItem('cherry-clone:api-stats')
        return saved ? JSON.parse(saved) : { totalCalls: 0, totalTokens: 0, totalTime: 0, avgTime: 0, estimatedCost: 0 }
      })()
      const totalTokens = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0)
      stats.totalCalls += 1
      stats.totalTokens += totalTokens
      stats.estimatedCost += (totalTokens / 1000) * 0.001
      localStorage.setItem('cherry-clone:api-stats', JSON.stringify(stats))

      // Send system notification if app is backgrounded
      if (!error && text && document.hidden) {
        window.api.invoke(IpcChannel.NOTIFY, {
          title: assistant?.name ?? 'Assistant',
          body: text.slice(0, 120) + (text.length > 120 ? '…' : '')
        }).catch(() => {/* non-fatal */})
      }

      const content = error ? `*Error: ${error}*` : text
      window.api
        .invoke(IpcChannel.MESSAGES_CREATE, {
          topicId,
          role: 'assistant',
          content,
          modelId: assistant?.modelId,
          providerId: assistant?.providerId,
          usage
        })
        .then((msg) => {
          setMessages((prev) => {
            const updated = [...prev, msg as Message]
            // Auto-name topic after the very first assistant reply
            if (updated.filter((m) => m.role === 'assistant').length === 1 && assistant?.providerId && assistant?.modelId) {
              window.api.invoke(IpcChannel.TOPICS_NAME, {
                topicId,
                firstUserMessage: firstUserMsgRef.current,
                firstAssistantReply: content.slice(0, 500),
                providerId: assistant.providerId,
                modelId: assistant.modelId
              })
            }
            return updated
          })
        })
    },
    [topicId, assistant]
  )

  const sendMessage = useCallback(
    async (userText: string, options: { webSearch?: boolean } = {}) => {
      if (!topicId || !assistant || streaming) return
      if (!assistant.providerId || !assistant.modelId) {
        alert('Configure a provider and model in the assistant settings first.')
        return
      }

      firstUserMsgRef.current = userText
      let contextPrefix = ''

      // Web search injection
      if (options.webSearch) {
        setSearching(true)
        try {
          const results = await window.api.invoke(IpcChannel.WEB_SEARCH, { query: userText, maxResults: 5 }) as SearchResult[]
          if (results.length > 0) {
            contextPrefix += [
              `[Web search results for "${userText}"]:`,
              ...results.map((r, i) => `${i + 1}. **${r.title}**\n   ${r.snippet}\n   Source: ${r.url}`)
            ].join('\n\n') + '\n\n'
          }
        } finally {
          setSearching(false)
        }
      }

      // Knowledge base injection
      if (selectedKnowledgeBaseId) {
        try {
          const docs = await window.api.invoke(IpcChannel.KNOWLEDGE_SEARCH, {
            knowledgeBaseId: selectedKnowledgeBaseId, query: userText, limit: 5
          }) as Array<{ name: string; content: string }>
          if (docs.length > 0) {
            contextPrefix += [
              '[Relevant knowledge base context]:',
              ...docs.map((d, i) => `${i + 1}. **${d.name}**\n${d.content.slice(0, 500)}`)
            ].join('\n\n') + '\n\n'
          }
        } catch { /* KB search failure is non-fatal */ }
      }

      if (contextPrefix) contextPrefix += '---\nUser question: '

      const userMsg = (await window.api.invoke(IpcChannel.MESSAGES_CREATE, {
        topicId, role: 'user', content: userText
      })) as Message
      setMessages((prev) => [...prev, userMsg])

      const history = [...messages, userMsg].map((m, i, arr) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: i === arr.length - 1 && contextPrefix ? contextPrefix + m.content : m.content
      }))

      const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`
      requestIdRef.current = requestId
      setStreaming(true)
      setStreamingText('')

      window.api.invoke(IpcChannel.AI_CHAT, {
        requestId,
        providerId: assistant.providerId,
        modelId: assistant.modelId,
        messages: history,
        systemPrompt: assistant.prompt || undefined,
        temperature: assistant.temperature,
        maxTokens: assistant.maxTokens,
        topP: assistant.topP,
        frequencyPenalty: assistant.frequencyPenalty,
        presencePenalty: assistant.presencePenalty,
        mcpTools: mcpTools.length > 0
          ? mcpTools.reduce<Record<string, { description: string; inputSchema: Record<string, unknown> }>>((acc, t) => {
              acc[`${t.serverId}__${t.name}`] = { description: t.description, inputSchema: t.inputSchema }
              return acc
            }, {})
          : undefined
      })
    },
    [topicId, assistant, messages, streaming, selectedKnowledgeBaseId, mcpTools]
  )

  const abort = useCallback(() => {
    if (requestIdRef.current) {
      window.api.send(IpcChannel.AI_ABORT, requestIdRef.current)
    }
  }, [])

  const deleteMessage = useCallback(async (id: string) => {
    await window.api.invoke(IpcChannel.MESSAGES_DELETE, id)
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const editResend = useCallback(async (messageId: string, newText: string) => {
    if (!topicId || !assistant || streaming) return
    // Delete the old user message and everything after it, then send new text
    const idx = messages.findIndex((m) => m.id === messageId)
    if (idx < 0) return
    const toDelete = messages.slice(idx)
    await Promise.all(toDelete.map((m) => window.api.invoke(IpcChannel.MESSAGES_DELETE, m.id)))
    setMessages((prev) => prev.slice(0, idx))
    // Now send the new text as a fresh user message
    await sendMessage(newText)
  }, [topicId, assistant, messages, streaming, sendMessage])

  const regenerate = useCallback(async () => {
    if (!topicId || !assistant || streaming) return
    // Find last assistant message and delete it, then re-send the last user message
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastAssistant || !lastUser) return
    await window.api.invoke(IpcChannel.MESSAGES_DELETE, lastAssistant.id)
    setMessages((prev) => prev.filter((m) => m.id !== lastAssistant.id))

    const history = messages
      .filter((m) => m.id !== lastAssistant.id)
      .map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }))

    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`
    requestIdRef.current = requestId
    setStreaming(true)
    setStreamingText('')
    firstUserMsgRef.current = lastUser.content

    window.api.invoke(IpcChannel.AI_CHAT, {
      requestId,
      providerId: assistant.providerId,
      modelId: assistant.modelId,
      messages: history,
      systemPrompt: assistant.prompt || undefined,
      temperature: assistant.temperature,
      maxTokens: assistant.maxTokens,
      topP: assistant.topP,
      frequencyPenalty: assistant.frequencyPenalty,
      presencePenalty: assistant.presencePenalty,
      mcpTools: mcpTools.length > 0
        ? mcpTools.reduce<Record<string, { description: string; inputSchema: Record<string, unknown> }>>((acc, t) => {
            acc[`${t.serverId}__${t.name}`] = { description: t.description, inputSchema: t.inputSchema }
            return acc
          }, {})
        : undefined
    })
  }, [topicId, assistant, messages, streaming, mcpTools])

  return {
    messages, streaming, streamingText, searching,
    sendMessage, abort, deleteMessage, regenerate, editResend,
    selectedKnowledgeBaseId, setSelectedKnowledgeBaseId,
    mcpTools, setMcpTools
  }
}

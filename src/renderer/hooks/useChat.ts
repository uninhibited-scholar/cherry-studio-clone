import { useState, useEffect, useCallback, useRef } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { Message } from '@shared/data/types/message'
import type { Assistant } from '@shared/data/types/assistant'

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
  const requestIdRef = useRef<string | null>(null)
  const streamingTextRef = useRef('')

  useEffect(() => { streamingTextRef.current = streamingText }, [streamingText])

  // Load messages when topic changes
  useEffect(() => {
    if (!topicId) { setMessages([]); return }
    window.api.invoke(IpcChannel.MESSAGES_LIST, topicId).then((list) => {
      setMessages(list as Message[])
    })
  }, [topicId])

  // Subscribe to stream chunks
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
          setMessages((prev) => [...prev, msg as Message])
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

      // Optional web search
      let contextPrefix = ''
      if (options.webSearch) {
        setSearching(true)
        try {
          const results = await window.api.invoke(IpcChannel.WEB_SEARCH, { query: userText, maxResults: 5 }) as SearchResult[]
          if (results.length > 0) {
            contextPrefix = [
              `[Web search results for "${userText}"]:`,
              ...results.map((r, i) => `${i + 1}. **${r.title}**\n   ${r.snippet}\n   Source: ${r.url}`)
            ].join('\n\n') + '\n\n---\nUser question: '
          }
        } finally {
          setSearching(false)
        }
      }

      // Save user message (display text only, without the injected context)
      const userMsg = (await window.api.invoke(IpcChannel.MESSAGES_CREATE, {
        topicId, role: 'user', content: userText
      })) as Message
      setMessages((prev) => [...prev, userMsg])

      // Build history for the model (inject search context into last user turn)
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
        temperature: assistant.temperature
      })
    },
    [topicId, assistant, messages, streaming]
  )

  const abort = useCallback(() => {
    if (requestIdRef.current) {
      window.api.send(IpcChannel.AI_ABORT, requestIdRef.current)
    }
  }, [])

  return { messages, streaming, streamingText, searching, sendMessage, abort }
}

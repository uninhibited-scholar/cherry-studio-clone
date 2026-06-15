import { useState, useEffect, useCallback, useRef } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { Message } from '@shared/data/types/message'
import type { Assistant } from '@shared/data/types/assistant'

type StreamChunk =
  | { type: 'text'; text: string }
  | { type: 'done'; usage?: { inputTokens: number; outputTokens: number } }
  | { type: 'error'; error: string }

export function useChat(topicId: string | null, assistant: Assistant | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const requestIdRef = useRef<string | null>(null)

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

  const streamingTextRef = useRef('')
  useEffect(() => { streamingTextRef.current = streamingText }, [streamingText])

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
    async (userText: string) => {
      if (!topicId || !assistant || streaming) return
      if (!assistant.providerId || !assistant.modelId) {
        alert('Configure a provider and model in the assistant settings first.')
        return
      }

      // Save user message
      const userMsg = (await window.api.invoke(IpcChannel.MESSAGES_CREATE, {
        topicId,
        role: 'user',
        content: userText
      })) as Message
      setMessages((prev) => [...prev, userMsg])

      // Build chat history for context
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content
      }))

      // Start streaming
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

  return { messages, streaming, streamingText, sendMessage, abort }
}

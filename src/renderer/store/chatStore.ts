import { create } from 'zustand'
import { IpcChannel } from '@shared/IpcChannel'
import type { Message } from '@shared/data/types/message'

interface ChatStore {
  messages: Message[]
  streaming: boolean
  currentRequestId: string | null

  fetchMessages(topicId: string): Promise<void>
  appendMessage(msg: Message): void
  updateLastAssistantMessage(text: string): void
  clearMessages(): void
  setStreaming(streaming: boolean, requestId?: string | null): void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  streaming: false,
  currentRequestId: null,

  async fetchMessages(topicId) {
    const list = (await window.api.invoke(IpcChannel.MESSAGES_LIST, topicId)) as Message[]
    set({ messages: list })
  },

  appendMessage(msg) {
    set((state) => ({ messages: [...state.messages, msg] }))
  },

  updateLastAssistantMessage(text) {
    set((state) => {
      const msgs = [...state.messages]
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], content: text }
          break
        }
      }
      return { messages: msgs }
    })
  },

  clearMessages() {
    set({ messages: [], streaming: false, currentRequestId: null })
  },

  setStreaming(streaming, requestId) {
    set({ streaming, currentRequestId: requestId ?? null })
  }
}))

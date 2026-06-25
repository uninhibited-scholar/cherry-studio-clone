import { create } from 'zustand'
import { IpcChannel } from '@shared/IpcChannel'
import type { Assistant } from '@shared/data/types/assistant'
import type { Topic } from '@shared/data/types/message'

interface AssistantStore {
  assistants: Assistant[]
  selectedAssistantId: string | null
  topics: Topic[]
  selectedTopicId: string | null
  loading: boolean

  fetchAssistants(): Promise<void>
  selectAssistant(id: string | null): void
  createAssistant(data: Partial<Assistant> & { name: string }): Promise<Assistant>
  updateAssistant(data: Partial<Assistant> & { id: string; name: string }): Promise<void>
  deleteAssistant(id: string): Promise<void>

  fetchTopics(assistantId: string | null): Promise<void>
  selectTopic(id: string | null): void
  createTopic(assistantId: string): Promise<Topic>
  deleteTopic(id: string): Promise<void>
  updateTopic(id: string, title: string): void
}

export const useAssistantStore = create<AssistantStore>((set, get) => ({
  assistants: [],
  selectedAssistantId: null,
  topics: [],
  selectedTopicId: null,
  loading: false,

  async fetchAssistants() {
    set({ loading: true })
    try {
      const list = (await window.api.invoke(IpcChannel.ASSISTANTS_LIST)) as Assistant[]
      set({ assistants: list })
    } finally {
      set({ loading: false })
    }
  },

  selectAssistant(id) {
    set({ selectedAssistantId: id, topics: [], selectedTopicId: null })
    if (id) get().fetchTopics(id)
  },

  async createAssistant(data) {
    const created = (await window.api.invoke(IpcChannel.ASSISTANTS_UPSERT, data)) as Assistant
    set((state) => ({ assistants: [...state.assistants, created] }))
    return created
  },

  async updateAssistant(data) {
    const updated = (await window.api.invoke(IpcChannel.ASSISTANTS_UPSERT, data)) as Assistant
    set((state) => ({
      assistants: state.assistants.map((a) => (a.id === updated.id ? updated : a))
    }))
  },

  async deleteAssistant(id) {
    await window.api.invoke(IpcChannel.ASSISTANTS_DELETE, id)
    set((state) => ({
      assistants: state.assistants.filter((a) => a.id !== id),
      selectedAssistantId: state.selectedAssistantId === id ? null : state.selectedAssistantId
    }))
  },

  async fetchTopics(assistantId) {
    if (!assistantId) { set({ topics: [] }); return }
    const list = (await window.api.invoke(IpcChannel.TOPICS_LIST, assistantId)) as Topic[]
    set({ topics: list })
  },

  selectTopic(id) {
    set({ selectedTopicId: id })
  },

  async createTopic(assistantId) {
    const t = (await window.api.invoke(IpcChannel.TOPICS_CREATE, { assistantId })) as Topic
    set((state) => ({ topics: [t, ...state.topics] }))
    return t
  },

  async deleteTopic(id) {
    await window.api.invoke(IpcChannel.TOPICS_DELETE, id)
    set((state) => ({
      topics: state.topics.filter((t) => t.id !== id),
      selectedTopicId: state.selectedTopicId === id ? null : state.selectedTopicId
    }))
  },

  updateTopic(id, title) {
    set((state) => ({
      topics: state.topics.map((t) => (t.id === id ? { ...t, title } : t))
    }))
  }
}))

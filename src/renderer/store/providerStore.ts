import { create } from 'zustand'
import { IpcChannel } from '@shared/IpcChannel'
import type { Provider } from '@shared/data/types/provider'
import type { Model } from '@shared/data/types/model'

interface ProviderStore {
  providers: Provider[]
  models: Record<string, Model[]>
  loading: boolean
  fetchProviders(): Promise<void>
  upsertProvider(data: Partial<Provider>): Promise<void>
  deleteProvider(id: string): Promise<void>
  fetchModels(providerId: string): Promise<void>
  upsertModel(data: Partial<Model>): Promise<void>
  deleteModel(id: string): Promise<void>
}

export const useProviderStore = create<ProviderStore>((set, get) => ({
  providers: [],
  models: {},
  loading: false,

  async fetchProviders() {
    set({ loading: true })
    try {
      const list = (await window.api.invoke(IpcChannel.PROVIDERS_LIST)) as Provider[]
      set({ providers: list })
    } finally {
      set({ loading: false })
    }
  },

  async upsertProvider(data) {
    const updated = (await window.api.invoke(IpcChannel.PROVIDERS_UPSERT, data)) as Provider
    set((state) => {
      const exists = state.providers.some((p) => p.id === updated.id)
      return {
        providers: exists
          ? state.providers.map((p) => (p.id === updated.id ? updated : p))
          : [...state.providers, updated]
      }
    })
  },

  async deleteProvider(id) {
    await window.api.invoke(IpcChannel.PROVIDERS_DELETE, id)
    set((state) => ({
      providers: state.providers.filter((p) => p.id !== id),
      models: Object.fromEntries(Object.entries(state.models).filter(([k]) => k !== id))
    }))
  },

  async fetchModels(providerId) {
    const list = (await window.api.invoke(IpcChannel.MODELS_LIST, providerId)) as Model[]
    set((state) => ({ models: { ...state.models, [providerId]: list } }))
  },

  async upsertModel(data) {
    const updated = (await window.api.invoke(IpcChannel.MODELS_UPSERT, data)) as Model
    const providerId = updated.providerId
    set((state) => {
      const existing = state.models[providerId] ?? []
      const exists = existing.some((m) => m.id === updated.id)
      return {
        models: {
          ...state.models,
          [providerId]: exists
            ? existing.map((m) => (m.id === updated.id ? updated : m))
            : [...existing, updated]
        }
      }
    })
    // also refresh providers in case enabled status changed
    await get().fetchProviders()
  },

  async deleteModel(id) {
    await window.api.invoke(IpcChannel.MODELS_DELETE, id)
    set((state) => ({
      models: Object.fromEntries(
        Object.entries(state.models).map(([k, v]) => [k, v.filter((m) => m.id !== id)])
      )
    }))
  }
}))

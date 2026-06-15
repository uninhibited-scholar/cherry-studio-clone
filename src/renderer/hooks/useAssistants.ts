import { useState, useEffect, useCallback } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { Assistant } from '@shared/data/types/assistant'

export function useAssistants() {
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await window.api.invoke(IpcChannel.ASSISTANTS_LIST) as Assistant[]
      setAssistants(list)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const createAssistant = useCallback(async (data: Partial<Assistant> & { name: string }) => {
    const created = await window.api.invoke(IpcChannel.ASSISTANTS_UPSERT, data) as Assistant
    setAssistants((prev) => [...prev, created])
    return created
  }, [])

  const updateAssistant = useCallback(async (data: Partial<Assistant> & { id: string; name: string }) => {
    const updated = await window.api.invoke(IpcChannel.ASSISTANTS_UPSERT, data) as Assistant
    setAssistants((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    return updated
  }, [])

  const deleteAssistant = useCallback(async (id: string) => {
    await window.api.invoke(IpcChannel.ASSISTANTS_DELETE, id)
    setAssistants((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return { assistants, loading, refresh, createAssistant, updateAssistant, deleteAssistant }
}

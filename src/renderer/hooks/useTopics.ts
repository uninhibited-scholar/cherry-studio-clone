import { useState, useEffect, useCallback } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { Topic } from '@shared/data/types/message'

export function useTopics(assistantId: string | null) {
  const [topics, setTopics] = useState<Topic[]>([])

  const refresh = useCallback(async () => {
    if (!assistantId) { setTopics([]); return }
    const list = await window.api.invoke(IpcChannel.TOPICS_LIST, assistantId) as Topic[]
    setTopics(list)
  }, [assistantId])

  useEffect(() => { refresh() }, [refresh])

  const createTopic = useCallback(async () => {
    if (!assistantId) return null
    const t = await window.api.invoke(IpcChannel.TOPICS_CREATE, { assistantId }) as Topic
    setTopics((prev) => [t, ...prev])
    return t
  }, [assistantId])

  const deleteTopic = useCallback(async (id: string) => {
    await window.api.invoke(IpcChannel.TOPICS_DELETE, id)
    setTopics((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { topics, refresh, createTopic, deleteTopic }
}

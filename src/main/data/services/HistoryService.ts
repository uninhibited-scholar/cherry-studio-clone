import { desc, sql, eq } from 'drizzle-orm'
import { getDb } from '../db/DbService'
import { topic } from '../db/schemas/topic'
import { message } from '../db/schemas/message'
import { assistant } from '../db/schemas/assistant'

export type HistoryEntry = {
  topicId: string
  topicTitle: string
  assistantId: string
  assistantName: string
  assistantEmoji: string
  preview: string
  updatedAt: number
}

export type HistorySearchResult = HistoryEntry & {
  matchedContent: string
}

export class HistoryService {
  async listAll(limit = 50): Promise<HistoryEntry[]> {
    const db = getDb()
    const rows = await db
      .select({
        topicId: topic.id,
        topicTitle: topic.title,
        assistantId: assistant.id,
        assistantName: assistant.name,
        assistantEmoji: assistant.emoji,
        updatedAt: topic.updatedAt
      })
      .from(topic)
      .leftJoin(assistant, eq(assistant.id, topic.assistantId))
      .orderBy(desc(topic.updatedAt))
      .limit(limit)

    const result: HistoryEntry[] = []
    for (const row of rows) {
      // Get first user message as preview
      const previewRows = await db
        .select({ content: message.content })
        .from(message)
        .where(sql`${message.topicId} = ${row.topicId} AND ${message.role} = 'user'`)
        .limit(1)

      result.push({
        topicId: row.topicId,
        topicTitle: row.topicTitle,
        assistantId: row.assistantId ?? '',
        assistantName: row.assistantName ?? 'Unknown',
        assistantEmoji: row.assistantEmoji ?? '🤖',
        preview: previewRows[0]?.content.slice(0, 120) ?? '',
        updatedAt: row.updatedAt
      })
    }
    return result
  }

  async search(query: string, limit = 30): Promise<HistorySearchResult[]> {
    if (!query.trim()) return []
    const db = getDb()
    const pattern = `%${query.toLowerCase()}%`

    const matchedMessages = await db
      .select({
        topicId: message.topicId,
        content: message.content,
        role: message.role
      })
      .from(message)
      .where(sql`lower(${message.content}) LIKE ${pattern}`)
      .limit(limit * 2)

    const topicIds = [...new Set(matchedMessages.map((m) => m.topicId))].slice(0, limit)
    if (topicIds.length === 0) return []

    const results: HistorySearchResult[] = []
    for (const topicId of topicIds) {
      const topicRows = await db
        .select({ title: topic.title, assistantId: topic.assistantId, updatedAt: topic.updatedAt })
        .from(topic)
        .where(eq(topic.id, topicId))
      if (!topicRows[0]) continue

      const assistantRows = await db
        .select({ name: assistant.name, emoji: assistant.emoji })
        .from(assistant)
        .where(eq(assistant.id, topicRows[0].assistantId))

      const matched = matchedMessages.find((m) => m.topicId === topicId)
      results.push({
        topicId,
        topicTitle: topicRows[0].title,
        assistantId: topicRows[0].assistantId,
        assistantName: assistantRows[0]?.name ?? 'Unknown',
        assistantEmoji: assistantRows[0]?.emoji ?? '🤖',
        preview: matched?.content.slice(0, 120) ?? '',
        matchedContent: matched?.content.slice(0, 200) ?? '',
        updatedAt: topicRows[0].updatedAt
      })
    }

    return results.sort((a, b) => b.updatedAt - a.updatedAt)
  }
}

export const historyService = new HistoryService()

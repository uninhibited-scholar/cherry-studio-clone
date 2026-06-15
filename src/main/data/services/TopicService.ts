import { eq, desc } from 'drizzle-orm'
import { getDb } from '../db/DbService'
import { topic } from '../db/schemas/topic'
import type { Topic } from '@shared/data/types/message'
import { loggerService } from '@logger'
import { nanoid } from 'nanoid'

const logger = loggerService.withContext('TopicService')

export class TopicService {
  async listByAssistant(assistantId: string): Promise<Topic[]> {
    const db = getDb()
    const rows = await db
      .select()
      .from(topic)
      .where(eq(topic.assistantId, assistantId))
      .orderBy(desc(topic.updatedAt))
    return rows.map(rowToTopic)
  }

  async get(id: string): Promise<Topic | null> {
    const db = getDb()
    const rows = await db.select().from(topic).where(eq(topic.id, id))
    return rows[0] ? rowToTopic(rows[0]) : null
  }

  async create(assistantId: string, title?: string): Promise<Topic> {
    const db = getDb()
    const now = Date.now()
    const id = nanoid()

    await db.insert(topic).values({
      id,
      assistantId,
      title: title ?? 'New Topic',
      isPinned: false,
      createdAt: now,
      updatedAt: now
    })

    logger.info(`Created topic: ${id} for assistant ${assistantId}`)
    return (await this.get(id))!
  }

  async updateTitle(id: string, title: string): Promise<void> {
    const db = getDb()
    await db.update(topic).set({ title, updatedAt: Date.now() }).where(eq(topic.id, id))
  }

  async touch(id: string): Promise<void> {
    const db = getDb()
    await db.update(topic).set({ updatedAt: Date.now() }).where(eq(topic.id, id))
  }

  async delete(id: string): Promise<void> {
    const db = getDb()
    await db.delete(topic).where(eq(topic.id, id))
    logger.info(`Deleted topic: ${id}`)
  }
}

function rowToTopic(row: typeof topic.$inferSelect): Topic {
  return {
    id: row.id,
    assistantId: row.assistantId,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export const topicService = new TopicService()

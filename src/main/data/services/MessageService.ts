import { eq, asc } from 'drizzle-orm'
import { getDb } from '../db/DbService'
import { message } from '../db/schemas/message'
import type { Message } from '@shared/data/types/message'
import { loggerService } from '@logger'
import { nanoid } from 'nanoid'

const logger = loggerService.withContext('MessageService')

export class MessageService {
  async listByTopic(topicId: string): Promise<Message[]> {
    const db = getDb()
    const rows = await db
      .select()
      .from(message)
      .where(eq(message.topicId, topicId))
      .orderBy(asc(message.createdAt))
    return rows.map(rowToMessage)
  }

  async create(data: {
    topicId: string
    role: Message['role']
    content: string
    modelId?: string
    providerId?: string
  }): Promise<Message> {
    const db = getDb()
    const now = Date.now()
    const id = nanoid()

    await db.insert(message).values({
      id,
      topicId: data.topicId,
      role: data.role,
      content: data.content,
      modelId: data.modelId,
      providerId: data.providerId,
      usage: null,
      fileIds: [],
      thinkingContent: null,
      createdAt: now,
      updatedAt: now
    })

    logger.debug(`Created message: ${id} in topic ${data.topicId}`)
    return (await this.get(id))!
  }

  async get(id: string): Promise<Message | null> {
    const db = getDb()
    const rows = await db.select().from(message).where(eq(message.id, id))
    return rows[0] ? rowToMessage(rows[0]) : null
  }

  async updateContent(id: string, content: string, usage?: Message['usage']): Promise<void> {
    const db = getDb()
    await db
      .update(message)
      .set({ content, usage: usage ?? null, updatedAt: Date.now() })
      .where(eq(message.id, id))
  }

  async delete(id: string): Promise<void> {
    const db = getDb()
    await db.delete(message).where(eq(message.id, id))
  }

  async deleteByTopic(topicId: string): Promise<void> {
    const db = getDb()
    await db.delete(message).where(eq(message.topicId, topicId))
  }

  async createBranch(parentId: string, data: {
    topicId: string
    role: Message['role']
    content: string
    modelId?: string
    providerId?: string
  }): Promise<Message> {
    const db = getDb()
    const siblings = await this.getBranches(parentId)
    const branchIndex = siblings.length
    const now = Date.now()
    const id = nanoid()

    await db.insert(message).values({
      id,
      topicId: data.topicId,
      role: data.role,
      content: data.content,
      modelId: data.modelId,
      providerId: data.providerId,
      usage: null,
      fileIds: [],
      thinkingContent: null,
      parentId,
      branchIndex,
      createdAt: now,
      updatedAt: now
    })

    logger.debug(`Created branch message: ${id} from parent ${parentId} (index ${branchIndex})`)
    return (await this.get(id))!
  }

  async getBranches(parentId: string): Promise<Message[]> {
    const db = getDb()
    const rows = await db
      .select()
      .from(message)
      .where(eq(message.parentId, parentId))
      .orderBy(asc(message.branchIndex))
    return rows.map(rowToMessage)
  }

  async getActiveBranch(parentId: string): Promise<number> {
    const branches = await this.getBranches(parentId)
    if (branches.length === 0) return 0
    // Return the highest branch index as the "active" one (most recent fork)
    return branches[branches.length - 1].branchIndex ?? 0
  }
}

function rowToMessage(row: typeof message.$inferSelect): Message {
  return {
    id: row.id,
    topicId: row.topicId,
    role: row.role as Message['role'],
    content: row.content,
    modelId: row.modelId ?? undefined,
    providerId: row.providerId ?? undefined,
    usage: (row.usage as Message['usage']) ?? undefined,
    fileIds: (row.fileIds as string[]) ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export const messageService = new MessageService()

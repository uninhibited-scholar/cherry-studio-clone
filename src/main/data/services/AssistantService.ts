import { eq } from 'drizzle-orm'
import { getDb } from '../db/DbService'
import { assistant } from '../db/schemas/assistant'
import type { Assistant } from '@shared/data/types/assistant'
import { loggerService } from '@logger'
import { nanoid } from 'nanoid'

const logger = loggerService.withContext('AssistantService')

export class AssistantService {
  async list(): Promise<Assistant[]> {
    const db = getDb()
    const rows = await db.select().from(assistant).orderBy(assistant.sortOrder)
    return rows.map(rowToAssistant)
  }

  async get(id: string): Promise<Assistant | null> {
    const db = getDb()
    const rows = await db.select().from(assistant).where(eq(assistant.id, id))
    return rows[0] ? rowToAssistant(rows[0]) : null
  }

  async upsert(data: Partial<Assistant> & { name: string }): Promise<Assistant> {
    const db = getDb()
    const now = Date.now()
    const id = data.id ?? nanoid()

    await db
      .insert(assistant)
      .values({
        id,
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        prompt: data.prompt ?? '',
        modelId: data.modelId,
        providerId: data.providerId,
        maxTokens: data.maxTokens,
        temperature: data.temperature ?? 1,
        isBuiltin: data.isBuiltin ?? false,
        sortOrder: data.sortOrder ?? 0,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: assistant.id,
        set: {
          name: data.name,
          emoji: data.emoji,
          description: data.description,
          prompt: data.prompt ?? '',
          modelId: data.modelId,
          providerId: data.providerId,
          maxTokens: data.maxTokens,
          temperature: data.temperature ?? 1,
          sortOrder: data.sortOrder ?? 0,
          updatedAt: now
        }
      })

    logger.info(`Upserted assistant: ${id}`)
    return (await this.get(id))!
  }

  async delete(id: string): Promise<void> {
    const db = getDb()
    await db.delete(assistant).where(eq(assistant.id, id))
    logger.info(`Deleted assistant: ${id}`)
  }
}

function rowToAssistant(row: typeof assistant.$inferSelect): Assistant {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji ?? undefined,
    description: row.description ?? undefined,
    prompt: row.prompt,
    modelId: row.modelId ?? undefined,
    providerId: row.providerId ?? undefined,
    maxTokens: row.maxTokens ?? undefined,
    temperature: row.temperature,
    isBuiltin: row.isBuiltin,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export const assistantService = new AssistantService()

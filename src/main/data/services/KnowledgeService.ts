import { eq, desc, sql, count } from 'drizzle-orm'
import { getDb } from '../db/DbService'
import { knowledgeBase, knowledgeDocument } from '../db/schemas/knowledge'
import type { KnowledgeBase, KnowledgeDocument } from '@shared/data/types/knowledge'
import { nanoid } from 'nanoid'

export class KnowledgeService {
  async listBases(): Promise<KnowledgeBase[]> {
    const db = getDb()
    const rows = await db
      .select({
        id: knowledgeBase.id,
        name: knowledgeBase.name,
        description: knowledgeBase.description,
        createdAt: knowledgeBase.createdAt,
        updatedAt: knowledgeBase.updatedAt,
        documentCount: count(knowledgeDocument.id)
      })
      .from(knowledgeBase)
      .leftJoin(knowledgeDocument, eq(knowledgeDocument.knowledgeBaseId, knowledgeBase.id))
      .groupBy(knowledgeBase.id)
      .orderBy(desc(knowledgeBase.updatedAt))
    return rows
  }

  async createBase(data: { name: string; description?: string }): Promise<KnowledgeBase> {
    const db = getDb()
    const now = Date.now()
    const id = nanoid()
    await db.insert(knowledgeBase).values({
      id,
      name: data.name,
      description: data.description ?? '',
      createdAt: now,
      updatedAt: now
    })
    const rows = await db.select().from(knowledgeBase).where(eq(knowledgeBase.id, id))
    return { ...rows[0], documentCount: 0 }
  }

  async deleteBase(id: string): Promise<void> {
    const db = getDb()
    await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id))
  }

  async listDocuments(knowledgeBaseId: string): Promise<KnowledgeDocument[]> {
    const db = getDb()
    const rows = await db
      .select()
      .from(knowledgeDocument)
      .where(eq(knowledgeDocument.knowledgeBaseId, knowledgeBaseId))
      .orderBy(desc(knowledgeDocument.createdAt))
    return rows
  }

  async addDocument(data: {
    knowledgeBaseId: string
    name: string
    content: string
    type?: string
  }): Promise<KnowledgeDocument> {
    const db = getDb()
    const now = Date.now()
    const id = nanoid()
    await db.insert(knowledgeDocument).values({
      id,
      knowledgeBaseId: data.knowledgeBaseId,
      name: data.name,
      content: data.content,
      type: data.type ?? 'text',
      createdAt: now
    })
    // bump parent updatedAt
    await db.update(knowledgeBase).set({ updatedAt: now }).where(eq(knowledgeBase.id, data.knowledgeBaseId))
    const rows = await db.select().from(knowledgeDocument).where(eq(knowledgeDocument.id, id))
    return rows[0]
  }

  async deleteDocument(id: string): Promise<void> {
    const db = getDb()
    const rows = await db.select({ knowledgeBaseId: knowledgeDocument.knowledgeBaseId }).from(knowledgeDocument).where(eq(knowledgeDocument.id, id))
    await db.delete(knowledgeDocument).where(eq(knowledgeDocument.id, id))
    if (rows[0]) {
      await db.update(knowledgeBase).set({ updatedAt: Date.now() }).where(eq(knowledgeBase.id, rows[0].knowledgeBaseId))
    }
  }

  async search(knowledgeBaseId: string, query: string, limit = 5): Promise<KnowledgeDocument[]> {
    if (!query.trim()) return []
    const db = getDb()
    const pattern = `%${query.toLowerCase()}%`
    const rows = await db
      .select()
      .from(knowledgeDocument)
      .where(
        sql`${knowledgeDocument.knowledgeBaseId} = ${knowledgeBaseId}
          AND lower(${knowledgeDocument.content}) LIKE ${pattern}`
      )
      .limit(limit)
    return rows
  }
}

export const knowledgeService = new KnowledgeService()

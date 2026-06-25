import { eq, desc, sql, count } from 'drizzle-orm'
import { getDb } from '../db/DbService'
import { knowledgeBase, knowledgeDocument } from '../db/schemas/knowledge'
import type { KnowledgeBase, KnowledgeDocument } from '@shared/data/types/knowledge'
import { nanoid } from 'nanoid'
import { knowledgeIndexService } from './KnowledgeIndexService'

/** Chunk size and overlap for long documents (characters). */
const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 100

/** Split `text` into overlapping chunks of ~`chunkSize` characters. */
function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  if (text.length <= chunkSize) return [text]
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize))
    start += chunkSize - overlap
  }
  return chunks
}

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
    knowledgeIndexService.evict(id)
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

  /**
   * Add a single document row (no chunking). For long content prefer
   * `addDocumentChunked` which splits into overlapping chunks automatically.
   */
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
      chunkIndex: 0,
      createdAt: now
    })
    // Bump parent updatedAt
    await db.update(knowledgeBase).set({ updatedAt: now }).where(eq(knowledgeBase.id, data.knowledgeBaseId))
    const rows = await db.select().from(knowledgeDocument).where(eq(knowledgeDocument.id, id))

    // Rebuild BM25 index for this base
    await knowledgeIndexService.rebuildIndex(data.knowledgeBaseId)

    return rows[0]
  }

  /**
   * Split `content` into overlapping ~500-char chunks, store each chunk as a
   * separate row (with chunkIndex set), then rebuild the BM25 index.
   * Returns the first chunk's row for callers that need a document reference.
   */
  async addDocumentChunked(data: {
    knowledgeBaseId: string
    name: string
    content: string
    type?: string
  }): Promise<KnowledgeDocument> {
    const db = getDb()
    const now = Date.now()
    const chunks = chunkText(data.content)

    let firstRow: KnowledgeDocument | undefined

    for (let i = 0; i < chunks.length; i++) {
      const id = nanoid()
      await db.insert(knowledgeDocument).values({
        id,
        knowledgeBaseId: data.knowledgeBaseId,
        name: data.name,
        content: chunks[i],
        type: data.type ?? 'text',
        chunkIndex: i,
        createdAt: now
      })
      if (i === 0) {
        const rows = await db.select().from(knowledgeDocument).where(eq(knowledgeDocument.id, id))
        firstRow = rows[0]
      }
    }

    await db.update(knowledgeBase).set({ updatedAt: now }).where(eq(knowledgeBase.id, data.knowledgeBaseId))

    // Rebuild BM25 index for this base
    await knowledgeIndexService.rebuildIndex(data.knowledgeBaseId)

    return firstRow!
  }

  async deleteDocument(id: string): Promise<void> {
    const db = getDb()
    const rows = await db.select({ knowledgeBaseId: knowledgeDocument.knowledgeBaseId }).from(knowledgeDocument).where(eq(knowledgeDocument.id, id))
    await db.delete(knowledgeDocument).where(eq(knowledgeDocument.id, id))
    if (rows[0]) {
      await db.update(knowledgeBase).set({ updatedAt: Date.now() }).where(eq(knowledgeBase.id, rows[0].knowledgeBaseId))
      // Rebuild BM25 index for affected base
      await knowledgeIndexService.rebuildIndex(rows[0].knowledgeBaseId)
    }
  }

  /** BM25-ranked search replacing the previous LIKE query. */
  async search(knowledgeBaseId: string, query: string, limit = 5): Promise<KnowledgeDocument[]> {
    return knowledgeIndexService.search(knowledgeBaseId, query, limit)
  }
}

export const knowledgeService = new KnowledgeService()

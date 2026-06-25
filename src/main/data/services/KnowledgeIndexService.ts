/**
 * KnowledgeIndexService — per-knowledge-base BM25 index cache.
 *
 * On startup call `loadBase(knowledgeBaseId)` to hydrate from DB.
 * After adding / deleting documents call `rebuildIndex(knowledgeBaseId)`.
 */

import { eq } from 'drizzle-orm'
import { getDb } from '../db/DbService'
import { knowledgeDocument } from '../db/schemas/knowledge'
import { BM25Service } from '../../ai/EmbeddingService'
import type { KnowledgeDocument } from '@shared/data/types/knowledge'

export class KnowledgeIndexService {
  /** Map of knowledgeBaseId → BM25Service instance */
  private readonly indexes = new Map<string, BM25Service>()

  /** Load (or reload) all chunks for a knowledge base into the BM25 index. */
  async rebuildIndex(knowledgeBaseId: string): Promise<void> {
    const db = getDb()
    const rows = await db
      .select()
      .from(knowledgeDocument)
      .where(eq(knowledgeDocument.knowledgeBaseId, knowledgeBaseId))

    const bm25 = new BM25Service()
    bm25.index(rows.map((r) => ({ id: r.id, text: r.content })))
    this.indexes.set(knowledgeBaseId, bm25)
  }

  /** Search a knowledge base using BM25. Returns full document rows. */
  async search(knowledgeBaseId: string, query: string, limit: number): Promise<KnowledgeDocument[]> {
    if (!query.trim()) return []

    // Lazy-load index if not yet in cache
    if (!this.indexes.has(knowledgeBaseId)) {
      await this.rebuildIndex(knowledgeBaseId)
    }

    const bm25 = this.indexes.get(knowledgeBaseId)!
    const hits = bm25.search(query, limit)
    if (hits.length === 0) return []

    const db = getDb()
    const hitIds = new Set(hits.map((h) => h.id))

    const rows = await db
      .select()
      .from(knowledgeDocument)
      .where(eq(knowledgeDocument.knowledgeBaseId, knowledgeBaseId))

    // Filter to hits and preserve BM25 ranking order
    const rowMap = new Map(rows.map((r) => [r.id, r]))
    return hits.map((h) => rowMap.get(h.id)).filter((r): r is KnowledgeDocument => r !== undefined)
  }

  /** Evict a stale index (e.g. after base deletion). */
  evict(knowledgeBaseId: string): void {
    this.indexes.delete(knowledgeBaseId)
  }
}

export const knowledgeIndexService = new KnowledgeIndexService()

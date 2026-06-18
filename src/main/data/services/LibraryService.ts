import { eq, desc } from 'drizzle-orm'
import { getDb } from '../db/DbService'
import { promptTemplate } from '../db/schemas/library'
import type { PromptTemplate } from '@shared/data/types/library'
import { nanoid } from 'nanoid'

export class LibraryService {
  async list(): Promise<PromptTemplate[]> {
    const db = getDb()
    const rows = await db.select().from(promptTemplate).orderBy(desc(promptTemplate.createdAt))
    return rows
  }

  async create(data: { name: string; content: string; category?: string }): Promise<PromptTemplate> {
    const db = getDb()
    const id = nanoid()
    const now = Date.now()
    await db.insert(promptTemplate).values({
      id,
      name: data.name,
      content: data.content,
      category: data.category ?? 'General',
      createdAt: now
    })
    const rows = await db.select().from(promptTemplate).where(eq(promptTemplate.id, id))
    return rows[0]
  }

  async delete(id: string): Promise<void> {
    const db = getDb()
    await db.delete(promptTemplate).where(eq(promptTemplate.id, id))
  }
}

export const libraryService = new LibraryService()

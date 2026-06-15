import { eq, desc, asc } from 'drizzle-orm'
import { getDb } from '../db/DbService'
import { note } from '../db/schemas/note'
import type { Note } from '@shared/data/types/note'
import { nanoid } from 'nanoid'

export class NoteService {
  async list(): Promise<Note[]> {
    const db = getDb()
    const rows = await db
      .select()
      .from(note)
      .orderBy(desc(note.isPinned), asc(note.updatedAt))
    return rows.map(rowToNote)
  }

  async get(id: string): Promise<Note | null> {
    const db = getDb()
    const rows = await db.select().from(note).where(eq(note.id, id))
    return rows[0] ? rowToNote(rows[0]) : null
  }

  async create(data: Partial<Note>): Promise<Note> {
    const db = getDb()
    const now = Date.now()
    const id = nanoid()
    await db.insert(note).values({
      id,
      title: data.title ?? 'Untitled',
      content: data.content ?? '',
      folderId: data.folderId,
      isPinned: data.isPinned ?? false,
      createdAt: now,
      updatedAt: now
    })
    return (await this.get(id))!
  }

  async update(id: string, data: Partial<Pick<Note, 'title' | 'content' | 'isPinned' | 'folderId'>>): Promise<void> {
    const db = getDb()
    await db.update(note).set({ ...data, updatedAt: Date.now() }).where(eq(note.id, id))
  }

  async delete(id: string): Promise<void> {
    const db = getDb()
    await db.delete(note).where(eq(note.id, id))
  }
}

function rowToNote(row: typeof note.$inferSelect): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    folderId: row.folderId ?? undefined,
    isPinned: row.isPinned,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export const noteService = new NoteService()

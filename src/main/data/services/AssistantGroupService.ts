import { eq, asc } from 'drizzle-orm'
import { getDb } from '../db/DbService'
import { assistantGroup } from '../db/schemas/assistant'
import { assistant } from '../db/schemas/assistant'
import type { AssistantGroup } from '@shared/data/types/assistant'
import { nanoid } from 'nanoid'

export class AssistantGroupService {
  async list(): Promise<AssistantGroup[]> {
    const db = getDb()
    const rows = await db.select().from(assistantGroup).orderBy(asc(assistantGroup.sortOrder))
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      sortOrder: r.sortOrder ?? 0,
      createdAt: r.createdAt
    }))
  }

  async create(name: string): Promise<AssistantGroup> {
    const db = getDb()
    const id = nanoid()
    const now = Date.now()
    await db.insert(assistantGroup).values({ id, name, sortOrder: 0, createdAt: now })
    const rows = await db.select().from(assistantGroup).where(eq(assistantGroup.id, id))
    const r = rows[0]
    return { id: r.id, name: r.name, sortOrder: r.sortOrder ?? 0, createdAt: r.createdAt }
  }

  async delete(id: string): Promise<void> {
    const db = getDb()
    // Move assistants in this group to ungrouped
    await db.update(assistant).set({ groupId: null }).where(eq(assistant.groupId, id))
    await db.delete(assistantGroup).where(eq(assistantGroup.id, id))
  }

  async moveAssistant(assistantId: string, groupId: string | null): Promise<void> {
    const db = getDb()
    await db.update(assistant).set({ groupId }).where(eq(assistant.id, assistantId))
  }
}

export const assistantGroupService = new AssistantGroupService()

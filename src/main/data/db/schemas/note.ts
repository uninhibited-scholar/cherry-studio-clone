import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const note = sqliteTable('note', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default('Untitled'),
  content: text('content').notNull().default(''),
  /** folder / grouping path e.g. "work/project-a" */
  folderId: text('folder_id'),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

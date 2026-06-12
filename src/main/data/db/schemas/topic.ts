import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const topic = sqliteTable('topic', {
  id: text('id').primaryKey(),
  assistantId: text('assistant_id').notNull(),
  title: text('title').notNull().default('New Topic'),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

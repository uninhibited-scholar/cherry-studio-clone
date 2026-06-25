import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const knowledgeBase = sqliteTable('knowledge_base', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export const knowledgeDocument = sqliteTable('knowledge_document', {
  id: text('id').primaryKey(),
  knowledgeBaseId: text('knowledge_base_id').notNull().references(() => knowledgeBase.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  content: text('content').notNull().default(''),
  type: text('type').notNull().default('text'),
  /** Reserved for future vector embedding storage (e.g. JSON-encoded float array). */
  embedding: text('embedding'),
  /** Index of this chunk within a parent document (0 = whole document or first chunk). */
  chunkIndex: integer('chunk_index').notNull().default(0),
  createdAt: integer('created_at').notNull()
})

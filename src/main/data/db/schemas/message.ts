import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const message = sqliteTable('message', {
  id: text('id').primaryKey(),
  topicId: text('topic_id').notNull(),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull().default(''),
  modelId: text('model_id'),
  providerId: text('provider_id'),
  usage: text('usage', { mode: 'json' }),
  fileIds: text('file_ids', { mode: 'json' }).$type<string[]>().default([]),
  /** Reasoning / thinking content (for o1/claude reasoning) */
  thinkingContent: text('thinking_content'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

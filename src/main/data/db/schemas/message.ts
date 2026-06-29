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
  /** Branching: id of the parent message this is a branch of (null = root) */
  parentId: text('parent_id'),
  /** Branch index among siblings (0 = original, 1,2,… = forks) */
  branchIndex: integer('branch_index').default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

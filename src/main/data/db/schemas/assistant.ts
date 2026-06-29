import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const assistantGroup = sqliteTable('assistant_group', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at').notNull()
})

export const assistant = sqliteTable('assistant', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  emoji: text('emoji'),
  description: text('description'),
  prompt: text('prompt').notNull().default(''),
  modelId: text('model_id'),
  providerId: text('provider_id'),
  maxTokens: integer('max_tokens'),
  temperature: real('temperature').notNull().default(1),
  topP: real('top_p'),
  frequencyPenalty: real('frequency_penalty'),
  presencePenalty: real('presence_penalty'),
  isBuiltin: integer('is_builtin', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  groupId: text('group_id'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

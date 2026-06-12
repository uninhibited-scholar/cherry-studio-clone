import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const userProvider = sqliteTable('user_provider', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  apiKey: text('api_key'),
  apiHost: text('api_host'),
  defaultEndpointType: text('default_endpoint_type').notNull().default('openai_chat_completions'),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  isBuiltin: integer('is_builtin', { mode: 'boolean' }).notNull().default(false),
  website: text('website', { mode: 'json' }),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export const userModel = sqliteTable('user_model', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull(),
  name: text('name').notNull(),
  displayName: text('display_name'),
  endpointType: text('endpoint_type'),
  capabilities: text('capabilities', { mode: 'json' }).$type<string[]>().default([]),
  contextWindow: integer('context_window'),
  maxOutputTokens: integer('max_output_tokens'),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  pricing: text('pricing', { mode: 'json' }),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

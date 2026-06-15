import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const translateHistory = sqliteTable('translate_history', {
  id: text('id').primaryKey(),
  sourceText: text('source_text').notNull(),
  targetText: text('target_text').notNull(),
  sourceLang: text('source_lang').notNull().default('auto'),
  targetLang: text('target_lang').notNull().default('en'),
  providerId: text('provider_id'),
  modelId: text('model_id'),
  createdAt: integer('created_at').notNull()
})

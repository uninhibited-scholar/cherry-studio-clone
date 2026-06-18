import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const promptTemplate = sqliteTable('prompt_template', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull().default('General'),
  createdAt: integer('created_at').notNull()
})

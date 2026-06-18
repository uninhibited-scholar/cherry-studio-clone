import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const painting = sqliteTable('painting', {
  id: text('id').primaryKey(),
  prompt: text('prompt').notNull(),
  negativePrompt: text('negative_prompt').notNull().default(''),
  /** base64-encoded image */
  imageData: text('image_data').notNull(),
  width: integer('width').notNull().default(1024),
  height: integer('height').notNull().default(1024),
  modelName: text('model_name').notNull(),
  providerId: text('provider_id').notNull(),
  createdAt: integer('created_at').notNull()
})

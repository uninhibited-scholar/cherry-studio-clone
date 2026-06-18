import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const mcpServer = sqliteTable('mcp_server', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().default('stdio'),
  command: text('command'),
  url: text('url'),
  envJson: text('env_json'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

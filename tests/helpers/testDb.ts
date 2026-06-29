import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../src/main/data/db/schemas'
import { sql } from 'drizzle-orm'

export function createTestDb() {
  const client = createClient({ url: ':memory:' })
  const db = drizzle(client, { schema })
  return db
}

export async function setupSchema(db: ReturnType<typeof createTestDb>) {
  // Create all tables needed for tests
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS user_provider (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      api_key TEXT,
      api_host TEXT,
      default_endpoint_type TEXT NOT NULL DEFAULT 'openai_chat_completions',
      is_enabled INTEGER NOT NULL DEFAULT 1,
      is_builtin INTEGER NOT NULL DEFAULT 0,
      website TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS user_model (
      id TEXT PRIMARY KEY,
      provider_id TEXT NOT NULL,
      name TEXT NOT NULL,
      display_name TEXT,
      endpoint_type TEXT,
      capabilities TEXT DEFAULT '[]',
      context_window INTEGER,
      max_output_tokens INTEGER,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      is_custom INTEGER NOT NULL DEFAULT 0,
      pricing TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS assistant_group (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS assistant (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT,
      description TEXT,
      prompt TEXT NOT NULL DEFAULT '',
      model_id TEXT,
      provider_id TEXT,
      max_tokens INTEGER,
      temperature REAL NOT NULL DEFAULT 1,
      top_p REAL,
      frequency_penalty REAL,
      presence_penalty REAL,
      is_builtin INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      group_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS topic (
      id TEXT PRIMARY KEY,
      assistant_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'New Topic',
      is_pinned INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS message (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      model_id TEXT,
      provider_id TEXT,
      usage TEXT,
      file_ids TEXT DEFAULT '[]',
      thinking_content TEXT,
      parent_id TEXT,
      branch_index INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS knowledge_document (
      id TEXT PRIMARY KEY,
      knowledge_base_id TEXT NOT NULL REFERENCES knowledge_base(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'text',
      embedding TEXT,
      chunk_index INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `)
}

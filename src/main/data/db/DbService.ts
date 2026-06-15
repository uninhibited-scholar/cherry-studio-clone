import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schemas'
import { loggerService } from '@logger'
import path from 'path'
import { app } from 'electron'

const logger = loggerService.withContext('DbService')

function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'cherry-clone.db')
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (!_db) {
    const dbPath = getDbPath()
    logger.info(`Opening database: ${dbPath}`)
    const client = createClient({ url: `file:${dbPath}` })
    _db = drizzle(client, { schema })
  }
  return _db
}

export type Db = ReturnType<typeof getDb>

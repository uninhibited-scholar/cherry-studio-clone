import { migrate } from 'drizzle-orm/libsql/migrator'
import { getDb } from './DbService'
import { loggerService } from '@logger'
import path from 'path'

const logger = loggerService.withContext('DbMigrate')

export async function runMigrations(): Promise<void> {
  const db = getDb()
  const migrationsFolder = path.join(__dirname, '../../../../migrations')

  try {
    await migrate(db, { migrationsFolder })
    logger.info('Migrations completed')
  } catch (err) {
    logger.error('Migration failed', err)
    throw err
  }
}

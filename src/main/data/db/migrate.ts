import { migrate } from 'drizzle-orm/libsql/migrator'
import { getDb } from './DbService'
import { loggerService } from '@logger'
import path from 'path'
import { app } from 'electron'

const logger = loggerService.withContext('DbMigrate')

export async function runMigrations(): Promise<void> {
  const db = getDb()
  // app.getAppPath() resolves to project root in both dev and packaged builds
  const migrationsFolder = path.join(app.getAppPath(), 'migrations')

  try {
    await migrate(db, { migrationsFolder })
    logger.info('Migrations completed')
  } catch (err) {
    logger.error('Migration failed', err)
    throw err
  }
}

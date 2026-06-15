import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/main/data/db/schemas/index.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './dev.db'
  }
})

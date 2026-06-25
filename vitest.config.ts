import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@logger': resolve(__dirname, 'src/main/core/logger'),
    }
  }
})

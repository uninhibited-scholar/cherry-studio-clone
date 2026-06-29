import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    // Exclude ESM-only packages from externalization so rollup bundles them as CJS
    plugins: [externalizeDepsPlugin({
      exclude: [
        'ai', '@ai-sdk/openai', '@ai-sdk/anthropic', '@ai-sdk/google', '@ai-sdk/azure',
        '@ai-sdk/provider', '@ai-sdk/provider-utils', '@ai-sdk/ui-utils',
        'nanoid', 'ml-distance'
      ]
    })],
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@shared': resolve('src/shared'),
        '@application': resolve('src/main/core/application/index.ts'),
        '@logger': resolve('src/main/core/logger/index.ts')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@preload': resolve('src/preload')
      }
    }
  },
  renderer: {
    input: {
      index: resolve(__dirname, 'src/renderer/index.html'),
      'quick-assistant': resolve(__dirname, 'src/renderer/windows/quick-assistant.html'),
      'selection-assistant': resolve(__dirname, 'src/renderer/windows/selection-assistant.html')
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
        '@shared': resolve('src/shared')
      }
    }
  }
})

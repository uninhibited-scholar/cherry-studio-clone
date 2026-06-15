/// <reference types="vite/client" />

interface Window {
  api: {
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
    send: (channel: string, ...args: unknown[]) => void
    on: (channel: string, listener: (...args: unknown[]) => void) => () => void
  }
}

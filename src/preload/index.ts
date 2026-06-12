import { contextBridge, ipcRenderer } from 'electron'

/**
 * Preload — exposes a safe IPC bridge to the renderer via contextBridge.
 *
 * Rules:
 * - Never expose Node.js APIs directly to renderer.
 * - All IPC channels must be allowlisted here.
 */
const api = {
  /** Invoke a main-process handler and await the result */
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    return ipcRenderer.invoke(channel, ...args)
  },

  /** Send a fire-and-forget message to the main process */
  send: (channel: string, ...args: unknown[]): void => {
    ipcRenderer.send(channel, ...args)
  },

  /** Subscribe to events pushed from the main process */
  on: (channel: string, listener: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => listener(...args))
    return () => ipcRenderer.removeAllListeners(channel)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api

declare global {
  interface Window {
    api: ElectronAPI
  }
}

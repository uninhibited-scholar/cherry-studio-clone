import { useEffect } from 'react'
import { IpcChannel } from '@shared/IpcChannel'

/**
 * Registers keyboard shortcut listeners from main process IPC events and
 * handles renderer-side key events (Escape, etc.).
 *
 * Consumers must subscribe to the individual IPC channels separately
 * (e.g. via useIpc().on(IpcChannel.SHORTCUT_NEW_TOPIC, …)) to act on them.
 * This hook wires up global renderer-side key handling.
 */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    // Renderer-side: Escape key – blur active element so modals / menus can close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const active = document.activeElement as HTMLElement | null
        active?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // IPC listeners – log to console in dev so developers can see they're wired
    const cleanups: Array<() => void> = []

    const channels = [
      IpcChannel.SHORTCUT_NEW_TOPIC,
      IpcChannel.SHORTCUT_COMMAND_PALETTE,
      IpcChannel.SHORTCUT_SETTINGS,
      IpcChannel.SHORTCUT_FIND,
      IpcChannel.DEEP_LINK_OPEN_TOPIC,
      IpcChannel.DEEP_LINK_OPEN_SETTINGS,
      IpcChannel.DEEP_LINK
    ]

    for (const channel of channels) {
      const off = window.api.on(channel, (...args: unknown[]) => {
        // Dispatch a custom DOM event so individual page components can react
        window.dispatchEvent(new CustomEvent(channel, { detail: args }))
      })
      cleanups.push(off)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      cleanups.forEach((off) => off())
    }
  }, [])
}

import { useCallback } from 'react'

/** Type-safe wrapper around window.api.invoke */
export function useIpc() {
  const invoke = useCallback(<T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
    return window.api.invoke(channel, ...args) as Promise<T>
  }, [])

  const send = useCallback((channel: string, ...args: unknown[]): void => {
    window.api.send(channel, ...args)
  }, [])

  const on = useCallback(
    (channel: string, listener: (...args: unknown[]) => void): (() => void) => {
      return window.api.on(channel, listener)
    },
    []
  )

  return { invoke, send, on }
}

import { IpcChannel } from '../../src/shared/IpcChannel'
import { describe, test, expect } from 'vitest'

describe('IpcChannel', () => {
  test('all IPC channel values are unique strings', () => {
    const values = Object.values(IpcChannel)
    expect(new Set(values).size).toBe(values.length)
  })

  test('all IPC channel values are non-empty strings', () => {
    const values = Object.values(IpcChannel)
    for (const v of values) {
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
    }
  })
})

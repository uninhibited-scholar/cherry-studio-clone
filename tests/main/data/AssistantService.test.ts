import { describe, test, expect, beforeEach, vi } from 'vitest'
import { createTestDb, setupSchema } from '../../helpers/testDb'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp' } }))
vi.mock('@logger', () => ({
  loggerService: { withContext: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }) }
}))

let testDb: ReturnType<typeof createTestDb>

vi.mock('../../../src/main/data/db/DbService', () => ({
  getDb: () => testDb
}))

import { AssistantService } from '../../../src/main/data/services/AssistantService'

describe('AssistantService', () => {
  let service: AssistantService

  beforeEach(async () => {
    testDb = createTestDb()
    await setupSchema(testDb)
    service = new AssistantService()
  })

  test('list() returns empty array initially', async () => {
    const result = await service.list()
    expect(result).toEqual([])
  })

  test('upsert() creates a new assistant', async () => {
    const a = await service.upsert({ name: 'My Assistant', prompt: 'You are helpful.' })
    expect(a.id).toBeTruthy()
    expect(a.name).toBe('My Assistant')
    expect(a.prompt).toBe('You are helpful.')
    expect(a.isBuiltin).toBe(false)
  })

  test('list() returns created assistants', async () => {
    await service.upsert({ name: 'A1' })
    await service.upsert({ name: 'A2' })
    const list = await service.list()
    expect(list).toHaveLength(2)
  })

  test('upsert() with existing id updates the assistant', async () => {
    const a = await service.upsert({ name: 'Old Name' })
    const updated = await service.upsert({ id: a.id, name: 'New Name', prompt: 'Updated prompt' })
    expect(updated.id).toBe(a.id)
    expect(updated.name).toBe('New Name')
    const list = await service.list()
    expect(list).toHaveLength(1)
  })

  test('delete() removes the assistant', async () => {
    const a = await service.upsert({ name: 'ToDelete' })
    await service.delete(a.id)
    const list = await service.list()
    expect(list).toHaveLength(0)
  })

  test('get() returns null for unknown id', async () => {
    const result = await service.get('nonexistent')
    expect(result).toBeNull()
  })

  test('get() returns the assistant by id', async () => {
    const a = await service.upsert({ name: 'Found', emoji: '🤖' })
    const found = await service.get(a.id)
    expect(found).not.toBeNull()
    expect(found!.name).toBe('Found')
  })
})

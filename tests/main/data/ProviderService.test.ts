import { describe, test, expect, beforeEach, vi } from 'vitest'
import { createTestDb, setupSchema } from '../../helpers/testDb'

// Mock electron (used by DbService)
vi.mock('electron', () => ({ app: { getPath: () => '/tmp' } }))

// Mock logger
vi.mock('@logger', () => ({
  loggerService: { withContext: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }) }
}))

let testDb: ReturnType<typeof createTestDb>

vi.mock('../../../src/main/data/db/DbService', () => ({
  getDb: () => testDb
}))

// Import after mocks
import { ProviderService } from '../../../src/main/data/services/ProviderService'

describe('ProviderService', () => {
  let service: ProviderService

  beforeEach(async () => {
    testDb = createTestDb()
    await setupSchema(testDb)
    service = new ProviderService()
  })

  test('listProviders() returns empty array initially', async () => {
    const result = await service.listProviders()
    expect(result).toEqual([])
  })

  test('upsertProvider() creates a new provider', async () => {
    const p = await service.upsertProvider({ name: 'OpenAI', apiKey: 'sk-test' })
    expect(p.id).toBeTruthy()
    expect(p.name).toBe('OpenAI')
    expect(p.apiKey).toBe('sk-test')
    expect(p.isEnabled).toBe(true)
  })

  test('listProviders() returns created provider', async () => {
    await service.upsertProvider({ name: 'OpenAI' })
    const list = await service.listProviders()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('OpenAI')
  })

  test('upsertProvider() with existing id updates it', async () => {
    const p = await service.upsertProvider({ name: 'OpenAI' })
    const updated = await service.upsertProvider({ id: p.id, name: 'OpenAI Updated', apiKey: 'new-key' })
    expect(updated.id).toBe(p.id)
    expect(updated.name).toBe('OpenAI Updated')
    expect(updated.apiKey).toBe('new-key')

    const list = await service.listProviders()
    expect(list).toHaveLength(1)
  })

  test('deleteProvider() removes the provider', async () => {
    const p = await service.upsertProvider({ name: 'ToDelete' })
    await service.deleteProvider(p.id)
    const list = await service.listProviders()
    expect(list).toHaveLength(0)
  })

  test('listModels(providerId) returns models for that provider', async () => {
    const p = await service.upsertProvider({ name: 'OpenAI' })
    await service.upsertModel({ name: 'gpt-4', providerId: p.id })
    await service.upsertModel({ name: 'gpt-3.5', providerId: p.id })

    const models = await service.listModels(p.id)
    expect(models).toHaveLength(2)
    expect(models.map((m) => m.name)).toContain('gpt-4')
  })

  test('listModels() without providerId returns all models', async () => {
    const p1 = await service.upsertProvider({ name: 'OpenAI' })
    const p2 = await service.upsertProvider({ name: 'Anthropic' })
    await service.upsertModel({ name: 'gpt-4', providerId: p1.id })
    await service.upsertModel({ name: 'claude-3', providerId: p2.id })

    const all = await service.listModels()
    expect(all).toHaveLength(2)
  })
})

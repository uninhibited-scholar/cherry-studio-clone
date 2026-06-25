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

// KnowledgeIndexService wraps BM25 — stub it out so tests remain fast and
// don't depend on the index implementation.
vi.mock('../../../src/main/data/services/KnowledgeIndexService', () => ({
  knowledgeIndexService: {
    rebuildIndex: vi.fn().mockResolvedValue(undefined),
    evict: vi.fn(),
    // For the search tests we need to delegate back to the real DB.
    // We'll override this per-test where needed.
    search: vi.fn()
  }
}))

import { KnowledgeService } from '../../../src/main/data/services/KnowledgeService'
import { knowledgeIndexService } from '../../../src/main/data/services/KnowledgeIndexService'

describe('KnowledgeService', () => {
  let service: KnowledgeService

  beforeEach(async () => {
    testDb = createTestDb()
    await setupSchema(testDb)
    service = new KnowledgeService()
  })

  test('listBases() returns empty array initially', async () => {
    const result = await service.listBases()
    expect(result).toEqual([])
  })

  test('createBase() returns a base with id and name', async () => {
    const base = await service.createBase({ name: 'My KB', description: 'Test KB' })
    expect(base.id).toBeTruthy()
    expect(base.name).toBe('My KB')
    expect(base.description).toBe('Test KB')
    expect(base.documentCount).toBe(0)
  })

  test('listBases() returns created base', async () => {
    await service.createBase({ name: 'My KB' })
    const list = await service.listBases()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('My KB')
  })

  test('deleteBase() removes the base', async () => {
    const base = await service.createBase({ name: 'ToDelete' })
    await service.deleteBase(base.id)
    const list = await service.listBases()
    expect(list).toHaveLength(0)
  })

  test('addDocument() stores document with content', async () => {
    const base = await service.createBase({ name: 'My KB' })
    const doc = await service.addDocument({
      knowledgeBaseId: base.id,
      name: 'Doc 1',
      content: 'Hello world content'
    })
    expect(doc.id).toBeTruthy()
    expect(doc.name).toBe('Doc 1')
    expect(doc.content).toBe('Hello world content')
    expect(doc.knowledgeBaseId).toBe(base.id)
  })

  test('search() delegates to knowledgeIndexService and returns its result', async () => {
    const base = await service.createBase({ name: 'KB' })
    const doc = await service.addDocument({ knowledgeBaseId: base.id, name: 'A', content: 'apple banana cherry' })

    const mockSearch = vi.mocked(knowledgeIndexService.search)
    mockSearch.mockResolvedValueOnce([doc])

    const results = await service.search(base.id, 'banana')
    expect(mockSearch).toHaveBeenCalledWith(base.id, 'banana', 5)
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('A')
  })

  test('search() returns empty array when index returns nothing', async () => {
    const base = await service.createBase({ name: 'KB' })
    vi.mocked(knowledgeIndexService.search).mockResolvedValueOnce([])

    const results = await service.search(base.id, 'zzznomatch')
    expect(results).toHaveLength(0)
  })
})

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

import { MessageService } from '../../../src/main/data/services/MessageService'

describe('MessageService', () => {
  let service: MessageService

  beforeEach(async () => {
    testDb = createTestDb()
    await setupSchema(testDb)
    service = new MessageService()
  })

  test('listByTopic() returns empty array for unknown topic', async () => {
    const result = await service.listByTopic('t-unknown')
    expect(result).toEqual([])
  })

  test('create() creates a message with role and content', async () => {
    const msg = await service.create({
      topicId: 'topic-1',
      role: 'user',
      content: 'Hello!'
    })
    expect(msg.id).toBeTruthy()
    expect(msg.topicId).toBe('topic-1')
    expect(msg.role).toBe('user')
    expect(msg.content).toBe('Hello!')
  })

  test('listByTopic() returns messages in ascending creation order', async () => {
    await service.create({ topicId: 't1', role: 'user', content: 'First' })
    await service.create({ topicId: 't1', role: 'assistant', content: 'Second' })
    const msgs = await service.listByTopic('t1')
    expect(msgs).toHaveLength(2)
    expect(msgs[0].content).toBe('First')
    expect(msgs[1].content).toBe('Second')
  })

  test('listByTopic() only returns messages for specified topic', async () => {
    await service.create({ topicId: 't1', role: 'user', content: 'T1 msg' })
    await service.create({ topicId: 't2', role: 'user', content: 'T2 msg' })
    const msgs = await service.listByTopic('t1')
    expect(msgs).toHaveLength(1)
    expect(msgs[0].content).toBe('T1 msg')
  })

  test('delete() removes a message', async () => {
    const msg = await service.create({ topicId: 't1', role: 'user', content: 'ToDelete' })
    await service.delete(msg.id)
    const msgs = await service.listByTopic('t1')
    expect(msgs).toHaveLength(0)
  })

  test('updateContent() updates message content', async () => {
    const msg = await service.create({ topicId: 't1', role: 'assistant', content: 'Old' })
    await service.updateContent(msg.id, 'New content')
    const updated = await service.get(msg.id)
    expect(updated!.content).toBe('New content')
  })

  test('get() returns null for unknown id', async () => {
    const result = await service.get('nonexistent')
    expect(result).toBeNull()
  })
})

import { NotFoundException } from '@nestjs/common'
import { TemplatesService } from './templates.service'

describe('TemplatesService', () => {
  function createService(overrides: Record<string, jest.Mock> = {}) {
    const repository = {
      findByHash: jest.fn(),
      create: jest.fn(),
      ...overrides
    }

    return {
      repository,
      service: new TemplatesService(repository as any)
    }
  }

  it('returns a template by hash and serializes its bigint id', async () => {
    const record = {
      id: 12n,
      createdAt: new Date('2026-07-28T00:00:00.000Z'),
      hashValue: 'hash_1',
      template: { pages: [] }
    }
    const { service } = createService({
      findByHash: jest.fn().mockResolvedValue(record)
    })

    await expect(service.getByHash('hash_1')).resolves.toEqual({
      ...record,
      id: '12'
    })
  })

  it('throws when the hash does not exist', async () => {
    const { service } = createService({
      findByHash: jest.fn().mockResolvedValue(null)
    })

    await expect(service.getByHash('missing')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('trims the hash before creating a template', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 13n,
      createdAt: new Date('2026-07-28T00:00:00.000Z'),
      hashValue: 'hash_2',
      template: { pages: [] }
    })
    const { service } = createService({ create })

    await service.create({ hashValue: ' hash_2 ', template: { pages: [] } })

    expect(create).toHaveBeenCalledWith('hash_2', { pages: [] })
  })
})

import { StorageService } from './storage.service'

describe('StorageService', () => {
  function createService(values: Record<string, unknown> = {}) {
    return new StorageService({
      get: jest.fn((key: string) => values[key])
    } as any)
  }

  it('uses the public asset proxy by default', () => {
    const service = createService()

    expect((service as any).publicUrl('workspaces/workspace 1/cover.jpg'))
      .toBe('/api/assets/public/workspaces/workspace%201/cover.jpg')
  })

  it('honors a configured public asset base URL', () => {
    const service = createService({
      ASSET_PUBLIC_BASE_URL: 'https://cdn.example.com/assets/'
    })

    expect((service as any).publicUrl('covers/demo.jpg'))
      .toBe('https://cdn.example.com/assets/covers/demo.jpg')
  })
})

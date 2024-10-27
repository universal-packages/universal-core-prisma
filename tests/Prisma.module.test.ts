import { Logger } from '@universal-packages/logger'
import EventEmitter from 'events'

import { PrismaModule } from '../src'

const eventEmitter = new EventEmitter()

jest.mock('@prisma/client', () => {
  class PrismaClient {
    $connect = jest.fn()
    $disconnect = jest.fn()
    $on = jest.fn().mockImplementation((event: string, cb: any) => {
      eventEmitter.on(event, cb)
    })
  }

  return { PrismaClient }
})

coreJest.runBare({
  coreConfigOverride: {
    config: { location: './tests/__fixtures__/config' },
    modules: { location: './tests/__fixtures__' },
    environments: { location: './tests/__fixtures__' },
    logger: { silence: false }
  }
})

describe(PrismaModule, (): void => {
  it('is configured as usual', async (): Promise<void> => {
    expect(global.prismaSubject).not.toBeUndefined()

    expect(core.coreModules.prisma.config).toEqual({
      datasourceUrl: 'file:./prisma.db'
    })
  })

  it('logs queries', async (): Promise<void> => {
    eventEmitter.emit('query', {
      duration: 1,
      query: 'SELECT * FROM users',
      params: []
    })

    expect(Logger).toHaveLogged({
      category: 'PRISMA',
      level: 'QUERY',
      measurement: expect.anything(),
      message: 'SELECT * FROM users',
      metadata: { params: [] }
    })
  })

  it('logs info', async (): Promise<void> => {
    eventEmitter.emit('info', {
      message: 'Database connected'
    })

    expect(Logger).toHaveLogged({
      category: 'PRISMA',
      level: 'INFO',
      message: 'Database connected'
    })
  })

  it('logs warnings', async (): Promise<void> => {
    eventEmitter.emit('warn', {
      message: 'Database disconnected'
    })

    expect(Logger).toHaveLogged({
      category: 'PRISMA',
      level: 'WARNING',
      message: 'Database disconnected'
    })
  })
})

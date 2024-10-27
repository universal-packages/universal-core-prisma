import { Logger } from '@universal-packages/logger'
import { SubProcess, TestEngine } from '@universal-packages/sub-process'

import PrismaTask from './__fixtures__/Prisma.task'

const coreConfigOverride = {
  config: { location: './tests/__fixtures__/config' },
  modules: { location: './tests/__fixtures__' },
  tasks: { location: './tests/__fixtures__' },
  environments: { location: './tests/__fixtures__' }
}

process.env['SELF_TEST'] = 'true'

describe(PrismaTask, (): void => {
  it('logs error and does not continue if no databse is configured', async (): Promise<void> => {
    await coreJest.execTask('prisma', { directive: 'init', coreConfigOverride: { ...coreConfigOverride, config: { location: './tests/__fixtures__/bad-config' } } })

    expect(Logger).toHaveLogged({
      level: 'ERROR',
      title: 'Prisma module configuration',
      category: 'PRISMA',
      message: 'Please initialize the Prisma module or create the prisma configuration file under the config directory'
    })
  })

  it('warns the user if they try to init from here', async (): Promise<void> => {
    await coreJest.execTask('prisma', { directive: 'init', coreConfigOverride })

    expect(Logger).toHaveLogged({ level: 'WARNING', title: 'Prisma init', category: 'PRISMA', message: 'Please use the universal initializer to initialize Prisma' })
  })

  it('warns the user if they try to studio from here', async (): Promise<void> => {
    await coreJest.execTask('prisma', { directive: 'studio', coreConfigOverride })

    expect(Logger).toHaveLogged({ level: 'WARNING', title: 'Prisma studio', category: 'PRISMA', message: 'Please use the prisma studio universal app to start Prisma Studio' })
  })

  it('runs the given command as if it was the normal cli', async (): Promise<void> => {
    TestEngine.mockProcessEvents({
      command: 'npx',
      args: ['prisma', 'generate', '--schema', './src/prisma/schema.prisma'],
      env: { DATABASE_URL: 'file:./prisma.db' },
      events: [{ type: 'stdout', data: 'Command stdout' }]
    })

    await coreJest.execTask('prisma', { directive: 'generate', coreConfigOverride })

    expect(SubProcess).toHaveRun({ command: 'npx', args: ['prisma', 'generate', '--schema', './src/prisma/schema.prisma'], env: { DATABASE_URL: 'file:./prisma.db' } })
    expect(Logger).toHaveLogged({ level: 'INFO', title: 'Prisma stdout', category: 'PRISMA', message: 'Command stdout' })
  })

  it('runs a composed db command', async (): Promise<void> => {
    TestEngine.mockProcessEvents({
      command: 'npx',
      args: ['prisma', 'db', 'pull', '--schema', './src/prisma/schema.prisma'],
      env: { DATABASE_URL: 'file:./prisma.db' },
      events: [{ type: 'stdout', data: 'Command stdout' }]
    })

    await coreJest.execTask('prisma', { directive: 'db', directiveOptions: ['pull'], coreConfigOverride })

    expect(SubProcess).toHaveRun({ command: 'npx', args: ['prisma', 'db', 'pull', '--schema', './src/prisma/schema.prisma'], env: { DATABASE_URL: 'file:./prisma.db' } })
    expect(Logger).toHaveLogged({ level: 'INFO', title: 'Prisma stdout', category: 'PRISMA', message: 'Command stdout' })
  })

  it('runs the root command', async (): Promise<void> => {
    await coreJest.execTask('prisma', { coreConfigOverride })

    expect(SubProcess).toHaveRun({ command: 'npx', args: ['prisma', ''], env: { DATABASE_URL: 'file:./prisma.db' } })
  })

  it('runs base commands', async (): Promise<void> => {
    await coreJest.execTask('prisma', { directive: 'migrate', coreConfigOverride })

    expect(SubProcess).toHaveRun({ command: 'npx', args: ['prisma', 'migrate'], env: { DATABASE_URL: 'file:./prisma.db' } })
  })

  it('forces migrate reset command to avoid prompt', async (): Promise<void> => {
    TestEngine.mockProcessEvents({
      command: 'npx',
      args: ['prisma', 'migrate', 'reset', '--schema', './src/prisma/schema.prisma', '--force'],
      env: { DATABASE_URL: 'file:./prisma.db' },
      events: [{ type: 'stdout', data: 'Command stdout' }]
    })

    await coreJest.execTask('prisma', { directive: 'migrate', directiveOptions: ['reset'], coreConfigOverride })

    expect(SubProcess).toHaveRun({
      command: 'npx',
      args: ['prisma', 'migrate', 'reset', '--schema', './src/prisma/schema.prisma', '--force'],
      env: { DATABASE_URL: 'file:./prisma.db' }
    })
    expect(Logger).toHaveLogged({ level: 'INFO', title: 'Prisma stdout', category: 'PRISMA', message: 'Command stdout' })
  })

  it('lets pass args except for schema which is always overwritten', async (): Promise<void> => {
    TestEngine.mockProcessEvents({
      command: 'npx',
      args: ['prisma', 'migrate', 'reset', '--fast', '1', '-s', '0', '--schema', './src/prisma/schema.prisma', '--force'],
      env: { DATABASE_URL: 'file:./prisma.db' },
      events: [{ type: 'stdout', data: 'Command stdout' }]
    })

    await coreJest.execTask('prisma', { directive: 'migrate', directiveOptions: ['reset'], args: { schema: 'some schema', fast: '1', s: '0' }, coreConfigOverride })

    expect(SubProcess).toHaveRun({
      command: 'npx',
      args: ['prisma', 'migrate', 'reset', '--fast', '1', '-s', '0', '--schema', './src/prisma/schema.prisma', '--force'],
      env: { DATABASE_URL: 'file:./prisma.db' }
    })
    expect(Logger).toHaveLogged({ level: 'INFO', title: 'Prisma stdout', category: 'PRISMA', message: 'Command stdout' })
  })

  it('can be aborted', async (): Promise<void> => {
    coreJest.execTask('prisma', { directive: 'migrate', directiveOptions: ['reset'], args: { schema: 'some schema', fast: '1', s: '0' }, coreConfigOverride })

    await coreJest.abortTask()

    expect(SubProcess).toHaveRun({
      command: 'npx',
      args: ['prisma', 'migrate', 'reset', '--fast', '1', '-s', '0', '--schema', './src/prisma/schema.prisma', '--force'],
      env: { DATABASE_URL: 'file:./prisma.db' }
    })
  })
})

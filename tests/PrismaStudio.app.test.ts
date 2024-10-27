import { SubProcess } from '@universal-packages/sub-process'

import PrismaStudioApp from '../src/PrismaStudio.universal-core-app'

coreJest.runApp('prisma-studio', {
  coreConfigOverride: {
    apps: { location: './tests/__fixtures__' },
    config: { location: './tests/__fixtures__/config' },
    modules: { location: './tests/__fixtures__' },
    logger: { silence: true }
  }
})

describe(PrismaStudioApp, (): void => {
  it('runs the studio command', async (): Promise<void> => {
    expect(SubProcess).toHaveRun({
      command: 'npx',
      args: ['prisma', 'studio', '--schema', './src/prisma/schema.prisma'],
      env: { DATABASE_URL: 'file:./prisma.db' }
    })
  })
})

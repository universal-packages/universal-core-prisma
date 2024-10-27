import { CoreApp } from '@universal-packages/core'
import { EmittedEvent } from '@universal-packages/event-emitter'
import { SubProcess } from '@universal-packages/sub-process'

export default class PrismaStudioApp extends CoreApp {
  public static readonly appName = 'prisma-studio'
  public static readonly description = 'Prisma Studio universal app'
  public static readonly allowAppWatch = false
  public static readonly allowLoadModules = false
  public static readonly allowLoadEnvironments = false

  private prismaStudioSubProcess: SubProcess

  public async run(): Promise<void> {
    const dbUrl = core.projectConfig['prisma-module']?.datasourceUrl || process.env['DATABASE_URL']

    this.prismaStudioSubProcess = core.developer.terminalPresenter.setSubProcess({
      command: 'npx',
      args: ['prisma', 'studio', '--schema', './src/prisma/schema.prisma'],
      env: {
        DATABASE_URL: dbUrl
      }
    })

    this.prismaStudioSubProcess.on('stdout', (event: EmittedEvent) => {
      const message = (event.payload.data || '').trim()

      this.logger.log({ level: 'INFO', message })
    })

    await this.prismaStudioSubProcess.run()
  }

  public async stop(): Promise<void> {
    await this.prismaStudioSubProcess.kill()
  }
}

import { PrismaClient } from '@prisma/client'
import { CoreModule } from '@universal-packages/core'
import { Measurement } from '@universal-packages/time-measurer'

import { LOG_CONFIGURATION } from './LOG_CONFIGURATION'
import { PrismaModuleConfig } from './types'

export default class PrismaModule extends CoreModule<PrismaModuleConfig> {
  public static readonly moduleName = 'prisma'
  public static readonly description = 'Prisma ORM module'

  public subject: PrismaClient

  public async prepare(): Promise<void> {
    this.subject = new PrismaClient({
      ...this.config,
      log: this.config.log || [
        {
          emit: 'event',
          level: 'query'
        },
        {
          emit: 'event',
          level: 'info'
        },
        {
          emit: 'event',
          level: 'warn'
        }
      ]
    })

    this.subject.$on('query' as never, (e: any) => {
      const measurement = new Measurement(BigInt(e.duration) * 10000n)

      this.logger.log({ level: 'QUERY', message: e.query, measurement, metadata: { params: e.params }, category: 'PRISMA' }, LOG_CONFIGURATION)
    })

    this.subject.$on('info' as never, (e: any) => {
      this.logger.log({ level: 'INFO', message: e.message, category: 'PRISMA' }, LOG_CONFIGURATION)
    })

    this.subject.$on('warn' as never, (e: any) => {
      this.logger.log({ level: 'WARNING', message: e.message, category: 'PRISMA' }, LOG_CONFIGURATION)
    })

    await this.subject.$connect()
  }

  public async release(): Promise<void> {
    if (this.subject) await this.subject.$disconnect()
  }
}

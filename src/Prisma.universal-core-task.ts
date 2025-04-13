import { CoreTask } from '@universal-packages/core'
import { SubProcess } from '@universal-packages/sub-process'
import os from 'os'

import { LOG_CONFIGURATION } from './LOG_CONFIGURATION'

export default class PrismaTask extends CoreTask {
  public static readonly taskName = 'prisma'
  public static readonly description = 'Prisma command'
  public static readonly allowLoadModules = false
  public static readonly allowLoadEnvironments = false

  private currentSubProcess: SubProcess
  private dbUrl: string

  public async exec(): Promise<void> {
    this.dbUrl = core.projectConfig['prisma-module']?.datasourceUrl || process.env['DATABASE_URL']

    if (!this.dbUrl) {
      this.logger.log(
        {
          level: 'ERROR',
          title: 'Prisma module configuration',
          category: 'PRISMA',
          message: 'Please initialize the Prisma module or create the prisma configuration file under the config directory'
        },
        LOG_CONFIGURATION
      )
      return
    }

    if (this.directive === 'init') {
      this.logger.log({ level: 'WARNING', title: 'Prisma init', category: 'PRISMA', message: 'Please use the universal initializer to initialize Prisma' }, LOG_CONFIGURATION)
      return
    }
    if (this.directive === 'studio') {
      this.logger.log(
        { level: 'WARNING', title: 'Prisma studio', category: 'PRISMA', message: 'Please use the prisma studio universal app to start Prisma Studio' },
        LOG_CONFIGURATION
      )
      return
    }

    this.currentSubProcess = this.buildSubProcess(this.dbUrl)

    this.currentSubProcess.on('stdout', (event) => {
      if (event.payload.data.trim()) this.logger.log({ level: 'INFO', title: 'Prisma stdout', category: 'PRISMA', message: event.payload.data.trim() }, LOG_CONFIGURATION)
    })

    await this.currentSubProcess.run()

    await this.runTestAdditional()
  }

  public async abort(): Promise<void> {
    if (this.currentSubProcess) await this.currentSubProcess.kill()
  }

  private generateAutoConfiguration(): string[] {
    const schemaConfiguration = ['--schema', './src/prisma/schema.prisma']

    if (this.directive) {
      switch (this.directive) {
        case 'db':
        case 'migrate':
          if (this.directiveOptions[0]) {
            if (this.directiveOptions[0] === 'reset') {
              return [...schemaConfiguration, '--force']
            } else {
              return schemaConfiguration
            }
          } else {
            return []
          }
        default:
          return schemaConfiguration
      }
    } else {
      return []
    }
  }

  private async runTestAdditional(): Promise<void> {
    if (process.env['NODE_ENV'] === 'development' || process.env['SELF_TEST'] === 'true') {
      const isMigrationMutation = this.directive === 'migrate' && ['dev', 'reset', 'deploy'].includes(this.directiveOptions[0])
      const idDbMutation = this.directive === 'db' && this.directiveOptions[0] === 'push'

      if (isMigrationMutation || idDbMutation) {
        const cpuCount = os.cpus().length
        const dbName = this.dbUrl.split('/').pop().split('?')[0]
        const dbNameTest = dbName.includes('development') ? dbName.replace('development', 'test') : `${dbName}-test`;
        const dbBaseTestUrl = this.dbUrl.replace(dbName, '{{db-name}}');

        for (let i = 0; i <= cpuCount; i++) {
          const currentDbTestUrl = dbBaseTestUrl.replace('{{db-name}}', `${dbNameTest}_${i}`)

          this.currentSubProcess = this.buildSubProcess(currentDbTestUrl)

          await this.currentSubProcess.run()

          this.logger.log(
            {
              level: 'QUERY',
              title: `Prisma test database ${dbName}_${i}`,
              category: 'PRISMA',
              message: `Command ${this.directive} ${this.directiveOptions[0]} was also ran for test database ${dbName}_${i}`
            },
            LOG_CONFIGURATION
          )
        }
      }
    }
  }

  private buildSubProcess(dbUrl: string): SubProcess {
    const argsArray = Object.keys(this.args)
      .filter((key) => key !== 'schema' && key.toLowerCase() === key)
      .map((key) => [key.length === 1 ? `-${key}` : `--${key}`, this.args[key]])
      .flat()

    return core.developer.terminalPresenter.setSubProcess({
      command: 'npx',
      args: ['prisma', this.directive, ...this.directiveOptions, ...argsArray, ...this.generateAutoConfiguration()],
      env: {
        DATABASE_URL: dbUrl
      }
    })
  }
}

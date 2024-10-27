import { CoreInitializer } from '@universal-packages/core'
import { SubProcess } from '@universal-packages/sub-process'

import { LOG_CONFIGURATION } from './LOG_CONFIGURATION'

export default class PrismaInitializer extends CoreInitializer {
  public static readonly initializerName = 'prisma'
  public static readonly description: string = 'Core Prisma initializer'

  public readonly templatesLocation: string = `${__dirname}/templates`

  private currentSubProcess: SubProcess
  private stopping = false

  public async afterTemplatePopulate(): Promise<void> {
    core.developer.terminalPresenter.setProgressPercentage(20)

    this.currentSubProcess = core.developer.terminalPresenter.setSubProcess({ command: 'mkdir', args: ['-p', 'tmp'] })
    await this.currentSubProcess.run()

    if (this.stopping) return

    core.developer.terminalPresenter.increaseProgressPercentageBy(2)

    this.logger.log({ level: 'INFO', title: 'Requesting prisma initialization', message: 'Executing npx prisma under the hood', category: 'PRISMA' }, LOG_CONFIGURATION)

    core.developer.terminalPresenter.startProgressIncreaseSimulation(78, 5000)

    this.currentSubProcess = core.developer.terminalPresenter.setSubProcess({
      command: 'npx',
      args: [
        'prisma',
        'init',
        ...Object.keys(this.args)
          .map((key) => [key.length === 1 ? `-${key}` : `--${key}`, this.args[key]])
          .flat()
      ],
      workingDirectory: './tmp'
    })
    await this.currentSubProcess.run()

    core.developer.terminalPresenter.finishProgressIncreaseSimulation()

    if (this.stopping) return

    this.logger.log({ level: 'INFO', title: 'Reconfiguring...', message: 'Reconfiguring to work as a universal packages module', category: 'PRISMA' }, LOG_CONFIGURATION)

    this.currentSubProcess = core.developer.terminalPresenter.setSubProcess({ command: 'mkdir', args: ['-p', `${this.sourceLocation}/prisma`] })
    await this.currentSubProcess.run()

    if (this.stopping) return

    this.currentSubProcess = core.developer.terminalPresenter.setSubProcess({
      command: 'rsync',
      args: ['-av', '--ignore-existing', './tmp/prisma', this.sourceLocation]
    })
    await this.currentSubProcess.run()

    if (this.stopping) return

    this.logger.log({ level: 'INFO', title: 'Finishing up...', message: 'Finishing up the prisma reconfiguration', category: 'PRISMA' }, LOG_CONFIGURATION)

    core.developer.terminalPresenter.increaseProgressPercentageBy(5)

    this.currentSubProcess = core.developer.terminalPresenter.setSubProcess({ command: 'rm', args: ['-rf', './tmp/prisma'] })
    await this.currentSubProcess.run()

    core.developer.terminalPresenter.setProgressPercentage(100)
  }

  public async abort(): Promise<void> {
    this.stopping = true

    if (this.currentSubProcess) await this.currentSubProcess.kill()
    core.developer.terminalPresenter.finishProgressIncreaseSimulation()

    this.currentSubProcess = core.developer.terminalPresenter.setSubProcess({ command: 'rm', args: ['-rf', './tmp/prisma'] })
    await this.currentSubProcess.run()
  }
}

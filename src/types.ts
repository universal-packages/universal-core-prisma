export type LogLevel = 'info' | 'query' | 'warn' | 'error'
export type LogDefinition = {
  level: LogLevel
  emit: 'stdout' | 'event'
}
export interface PrismaModuleConfig {
  datasources?: {
    db: {
      url?: string
    }
  }
  datasourceUrl?: string
  errorFormat?: string
  log?: (LogLevel | LogDefinition)[]
  transactionOptions?: {
    maxWait?: number
    timeout?: number
    isolationLevel?: string
  }
}

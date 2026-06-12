/**
 * Logger service stub.
 * All logging routes through here — never use console.log directly.
 *
 * Maps to Cherry Studio's loggerService pattern.
 */
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

class ContextLogger {
  constructor(private readonly context: string) {}

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    const prefix = `[${level.toUpperCase()}][${this.context}]`
    console[level === 'debug' ? 'log' : level](`${prefix} ${message}`, ...args)
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args)
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args)
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args)
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args)
  }
}

class LoggerService {
  withContext(context: string): ContextLogger {
    return new ContextLogger(context)
  }
}

export const loggerService = new LoggerService()

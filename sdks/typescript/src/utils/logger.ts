/**
 * Logger utility for OpenFiles SDK
 * 
 * Uses OPENFILES_LOG environment variable for log level control:
 * - none (default): No logging
 * - error: Only errors
 * - info: Important operations + errors
 * - debug: Everything (detailed flow)
 */

export type LogLevel = 'none' | 'error' | 'info' | 'debug'

class Logger {
  private level: LogLevel
  private prefix: string
  
  constructor(prefix = '[OpenFiles]') {
    this.prefix = prefix
    const envLevel = process.env.OPENFILES_LOG?.toLowerCase()
    this.level = (envLevel as LogLevel) || 'none'
  }
  
  /**
   * Log errors (shown in error, info, and debug levels)
   */
  error(message: string) {
    if (['error', 'info', 'debug'].includes(this.level)) {
      console.error(`${this.prefix} ERROR: ${message}`)
    }
  }
  
  /**
   * Log important information (shown in info and debug levels)
   */
  info(message: string) {
    if (['info', 'debug'].includes(this.level)) {
      console.log(`${this.prefix} ${message}`)
    }
  }
  
  /**
   * Log debug information (shown only in debug level)
   */
  debug(message: string) {
    if (this.level === 'debug') {
      console.log(`${this.prefix} [DEBUG] ${message}`)
    }
  }
  
  /**
   * Log successful operations (shown in info and debug levels)
   */
  success(operation: string, target: string, ms?: number) {
    if (['info', 'debug'].includes(this.level)) {
      const time = ms ? ` (${ms}ms)` : ''
      console.log(`${this.prefix} SUCCESS: ${operation}: ${target}${time}`)
    }
  }
  
  /**
   * Check if a specific log level is enabled
   */
  isEnabled(level: LogLevel): boolean {
    const levels: LogLevel[] = ['none', 'error', 'info', 'debug']
    const currentIndex = levels.indexOf(this.level)
    const checkIndex = levels.indexOf(level)
    return currentIndex >= checkIndex
  }
}

// Internal SDK logger - not exported to end users
const logger = new Logger()

// Export only for internal SDK use
export { logger }
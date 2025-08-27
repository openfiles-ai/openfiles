/**
 * Utility functions for clean example output and status reporting
 */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function createProgressIndicator() {
  const chars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let index = 0
  
  return {
    start: (message: string) => {
      process.stdout.write(`${message} ${chars[0]}`)
      return setInterval(() => {
        index = (index + 1) % chars.length
        process.stdout.write(`\r${message} ${chars[index]}`)
      }, 80)
    },
    
    stop: (interval: NodeJS.Timeout, success: boolean = true) => {
      clearInterval(interval)
      process.stdout.write(`\r${success ? '✅' : '❌'}`)
      console.log() // Move to next line
    }
  }
}

export function createSummaryReporter() {
  const operations = {
    created: 0,
    read: 0,
    edited: 0,
    listed: 0,
    errors: 0
  }
  
  const startTime = Date.now()
  
  return {
    increment: (operation: keyof typeof operations) => operations[operation]++,
    
    getSummary: () => ({
      ...operations,
      duration: Date.now() - startTime,
      total: operations.created + operations.read + operations.edited + operations.listed,
      success: operations.errors === 0
    }),
    
    printSummary: function(title: string = 'Operation Summary') {
      const summary = this.getSummary()
      console.log() // Empty line before summary
      console.log(`${summary.success ? '✅' : '❌'} ${title}`)
      console.log(`📊 Operations: ${summary.created} created, ${summary.read} read, ${summary.edited} edited, ${summary.listed} listed`)
      console.log(`⏱️  Duration: ${summary.duration}ms`)
      if (summary.errors > 0) {
        console.log(`❌ Errors: ${summary.errors}`)
      }
      return summary
    }
  }
}

export function cleanOutput(message: string, maxLength: number = 100): string {
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength - 3) + '...'
}

export function printIntegrationPattern(title: string, code: string) {
  console.log() // Empty line before pattern
  console.log(`📋 ${title}`)
  console.log('```typescript')
  console.log(code.trim())
  console.log('```')
}
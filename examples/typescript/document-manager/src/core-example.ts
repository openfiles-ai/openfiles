#!/usr/bin/env tsx
/**
 * Core API Integration Example
 * 
 * Shows how to integrate OpenFiles Core API into your application.
 * Best for: High-performance apps, direct control, non-AI use cases.
 */

import 'dotenv/config'
import { OpenFilesClient } from '@openfiles-ai/sdk/core'
import { salesDataCsv, customerDataCsv, appConfig, applicationLogs, formatFileSize } from './shared/sample-data.js'
import { generateSessionId, createSessionPaths, printSessionInfo } from './shared/session-utils.js'

async function coreIntegrationExample() {
  console.log('🔧 OpenFiles Core API Integration')
  
  // Step 1: Generate unique session for test isolation
  const sessionId = generateSessionId()
  const sessionPaths = createSessionPaths(sessionId, "core-demo")
  printSessionInfo(sessionId, sessionPaths)
  
  // Step 2: Initialize client (copy this pattern)
  if (!process.env.OPENFILES_API_KEY) {
    console.error('❌ Configure OPENFILES_API_KEY in .env')
    process.exit(1)
  }

  // Initialize client with session-specific basePath for organized file structure
  const client = new OpenFilesClient({
    apiKey: process.env.OPENFILES_API_KEY!,
    basePath: sessionPaths.businessApp  // All files will be under this session path
  })

  const startTime = Date.now()
  const operations = { created: 0, read: 0, edited: 0, listed: 0, errors: 0 }

  try {
    // Basic file operations with versatile business data

    // 1. Create business files using scoped clients for better organization
    console.log('📊 Creating business files with organized structure...')
    
    // Create scoped client for reports
    const reportsClient = client.withBasePath('reports')
    await reportsClient.writeFile({
      path: 'sales-data.csv',  // Creates: demo/business-app/reports/sales-data.csv
      content: salesDataCsv,
      contentType: 'text/csv'
    })
    operations.created++

    // Create scoped client for customer data
    const dataClient = client.withBasePath('data')
    await dataClient.writeFile({
      path: 'customers.csv',  // Creates: demo/business-app/data/customers.csv
      content: customerDataCsv,
      contentType: 'text/csv'
    })
    operations.created++

    // Create scoped client for configuration
    const configClient = client.withBasePath('config')
    await configClient.writeFile({
      path: 'app-settings.json',  // Creates: demo/business-app/config/app-settings.json
      content: JSON.stringify(appConfig, null, 2),
      contentType: 'application/json'
    })
    operations.created++

    // Create scoped client for logs
    const logsClient = client.withBasePath('logs')
    await logsClient.writeFile({
      path: 'application.log',  // Creates: demo/business-app/logs/application.log
      content: applicationLogs,
      contentType: 'text/plain'
    })
    operations.created++
    console.log('✅ Files created successfully with organized structure')

    // 2. Read and process files using scoped clients
    console.log('📖 Reading business data from organized structure...')
    const salesData = await reportsClient.readFile({ path: 'sales-data.csv' })
    const salesLines = salesData.split('\n').length - 1 // Exclude header
    operations.read++
    
    const configContent = await configClient.readFile({ path: 'app-settings.json' })
    const config = JSON.parse(configContent)
    console.log(`App name from config: ${config.app?.name || 'Unknown'}`)
    operations.read++
    console.log('✅ Data read successfully from organized paths')

    // 3. Update configuration and demonstrate more operations
    console.log('⚙️ Updating app configuration and demonstrating more operations...')
    await configClient.editFile({
      path: 'app-settings.json',
      oldString: '"version": "1.0.0"',
      newString: '"version": "1.1.0"'
    })
    operations.edited++

    // Demonstrate appendFile - add new log entry
    const newLogEntry = `\n[${new Date().toISOString()}] Configuration updated to v1.1.0`
    await logsClient.appendToFile({
      path: 'application.log',
      content: newLogEntry
    })
    
    // Demonstrate overwriteFile - create a summary report
    const summaryReport = `# Daily Operations Summary - ${new Date().toISOString().split('T')[0]}

## Files Created Today
- Sales data CSV with 9 customer records
- Customer database with 8 active customers  
- Application configuration (v1.1.0)
- System logs with 8+ entries

## Operations Completed
- File creation: ${operations.created}
- Data analysis: ${operations.read}
- File updates: ${operations.edited + 1}
- Directory listing: In progress

## System Status
- All services operational
- Database connections stable
- File storage: 50KB available

---
Report generated automatically`
    
    await logsClient.overwriteFile({
      path: 'daily-summary.md',
      content: summaryReport
    })
    operations.edited += 2  // append + overwrite operations
    console.log('✅ Updated logs with appendToFile and created summary with overwriteFile')

    // 4. List files in organized directories
    console.log('📁 Exploring organized file structure...')
    const allFiles = await client.listFiles({ limit: 20 })  // Lists all under demo/business-app/
    const reportFiles = await reportsClient.listFiles({ directory: '/', limit: 10 })  // Lists demo/business-app/reports/
    const configFiles = await configClient.listFiles({ directory: '/', limit: 10 })  // Lists demo/business-app/config/
    operations.listed += 3
    console.log('✅ Organized file structure explored')

    // 5. File monitoring and metadata with scoped clients
    const configMetadata = await configClient.getFileMetadata({ path: 'app-settings.json' })
    const configVersions = await configClient.getFileVersions({ path: 'app-settings.json' })

    // Success summary
    const duration = Date.now() - startTime
    console.log('✅ Core Integration Complete')
    console.log(`📊 Operations: ${operations.created} created, ${operations.read} read, ${operations.edited} edited, ${operations.listed} listed`)
    console.log(`⏱️  Duration: ${duration}ms`)
    console.log(`📁 Files: ${allFiles.files.length} total, ${reportFiles.files.length} reports, ${configFiles.files.length} config`)
    console.log(`📋 Sales data: ${salesLines} records`)
    console.log(`🔧 Config: v${configMetadata.version}, ${formatFileSize(configMetadata.size || 0)}`)
    console.log(`📚 Versions tracked: ${configVersions.versions.length}`)

  } catch (error) {
    operations.errors++
    console.error('\n❌ Integration failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Integration patterns you can copy:

/**
 * Pattern 1: Configuration Management with BasePath
 */
export async function createConfigManager(apiKey: string, baseUrl: string, environment: string, sessionId?: string) {
  // Generate session ID if not provided for test isolation
  if (!sessionId) {
    sessionId = generateSessionId()
  }
  
  // Create environment-specific config client with session isolation
  const configClient = new OpenFilesClient({
    apiKey,
    baseUrl,
    basePath: `config-mgr/session_${sessionId}/environments/${environment}/config`
  })
  
  return {
    async save(config: any) {
      return await configClient.writeFile({
        path: 'app-settings.json',
        content: JSON.stringify(config, null, 2),
        contentType: 'application/json'
      })
    },
    
    async load() {
      const content = await configClient.readFile({ path: 'app-settings.json' })
      return JSON.parse(content)
    }
  }
}

/**
 * Pattern 2: Team-Based Data Storage
 */
export async function createTeamStorage(client: OpenFilesClient, teamName: string, sessionId?: string) {
  // Generate session ID if not provided for test isolation
  if (!sessionId) {
    sessionId = generateSessionId()
  }
  
  // Create team-specific storage client with session isolation
  const teamClient = client.withBasePath(`teams/session_${sessionId}/${teamName}`)
  
  return {
    async saveData(filename: string, data: any) {
      return await teamClient.writeFile({
        path: `data/${filename}.json`,
        content: JSON.stringify(data, null, 2),
        contentType: 'application/json'
      })
    },
    
    async loadData(filename: string) {
      const content = await teamClient.readFile({ path: `data/${filename}.json` })
      return JSON.parse(content)
    }
  }
}

/**
 * Pattern 3: Application Logging with BasePath
 */
export async function createLogger(client: OpenFilesClient, appName: string, sessionId?: string) {
  // Generate session ID if not provided for test isolation
  if (!sessionId) {
    sessionId = generateSessionId()
  }
  
  // Create app-specific logger with organized log structure and session isolation
  const logsClient = client.withBasePath(`apps/session_${sessionId}/${appName}/logs`)
  const yearMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
  
  return {
    async log(level: 'INFO' | 'WARN' | 'ERROR', message: string) {
      const timestamp = new Date().toISOString()
      const logEntry = `[${timestamp}] [${level}] ${message}`
      const logFile = `${yearMonth}.log`
      
      try {
        // Try to append to existing monthly log
        const currentLog = await logsClient.readFile({ path: logFile })
        return await logsClient.editFile({
          path: logFile,
          oldString: currentLog,
          newString: currentLog + '\n' + logEntry
        })
      } catch {
        // Create new monthly log file if it doesn't exist
        return await logsClient.writeFile({
          path: logFile,
          content: logEntry,
          contentType: 'text/plain'
        })
      }
    }
  }
}

// Run the example if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  coreIntegrationExample().catch(console.error)
}
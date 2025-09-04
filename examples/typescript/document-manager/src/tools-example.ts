#!/usr/bin/env tsx
/**
 * Tools Integration Example
 * 
 * Shows how to integrate OpenFiles with any AI framework using function calling.
 * Best for: Custom AI frameworks, advanced control, multi-AI support.
 */

import 'dotenv/config'
import { OpenAI } from 'openai'
import { OpenFilesClient } from '@openfiles-ai/sdk/core'
import { OpenFilesTools } from '@openfiles-ai/sdk/tools'
import { customerDataCsv, formatFileSize } from './shared/sample-data.js'
import { generateSessionId, createSessionPaths, printSessionInfo } from './shared/session-utils.js'

async function toolsIntegrationExample() {
  console.log('🛠️ Tools Integration Example')

  // Step 1: Generate unique session for test isolation
  const sessionId = generateSessionId()
  const sessionPaths = createSessionPaths(sessionId, "tools-demo")
  printSessionInfo(sessionId, sessionPaths)

  // Step 2: Environment validation
  if (!process.env.OPENFILES_API_KEY) {
    console.error('❌ Configure OPENFILES_API_KEY in .env')
    process.exit(1)
  }

  // Initialize client and tools with session-specific organized structure
  const client = new OpenFilesClient({
    apiKey: process.env.OPENFILES_API_KEY!,
    basePath: sessionPaths.toolsTest  // All AI-generated files organized under session
  })

  // Create single unified tool for consistent basePath context
  const projectTools = new OpenFilesTools(client)  // Single tool for entire conversation
  const startTime = Date.now()
  let operationsCompleted = 0

  // Check for AI capabilities
  const useAI = process.env.OPENAI_API_KEY
  const openai = useAI ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }) : null
  const model = 'gpt-4o-mini'

  console.log(`🔧 Mode: ${useAI ? 'AI-powered' : 'Manual execution'}`)
  console.log(`🛠️  Available tools: ${projectTools.openai.definitions.length}`)

  try {
    if (openai) {
      // Maintain conversation context across all AI interactions  
      const conversation: any[] = [
        {
          role: 'system',
          content: 'You are a helpful business assistant. When working with files, always use the EXACT file paths I specify or that you create. Remember all previous operations in our conversation.'
        }
      ]

      // Step 1: Create sales report
      console.log('💬 User: "Create a sales report for January 2024 with our key metrics"')
      conversation.push({
        role: 'user',
        content: 'Create a sales report for January 2024. Include revenue of $125,000, 42 new customers, top regions (North America, Europe), and next month goals. Save it in the sales department folder as january-2024-sales.md'
      })

      const reportResponse = await openai.chat.completions.create({
        model,
        messages: conversation,
        tools: projectTools.openai.definitions,  // Using unified project tools
        temperature: 0.3,
        parallel_tool_calls: false  // Ensure sequential execution
      })

      // Process tools and get tool messages
      const reportProcessed = await projectTools.openai.processToolCalls(reportResponse)
      
      if (reportProcessed.handled) {
        console.log('✅ Sales report created at ai-workspace/sales-dept/january-2024-sales.md')
        operationsCompleted++
        
        // Add BOTH AI message and tool messages to conversation
        if (reportResponse.choices[0]?.message) {
          conversation.push(reportResponse.choices[0].message as any)
        }
        conversation.push(...reportProcessed.toolMessages)
      }

      // Step 2: List files  
      console.log('💬 User: "Show me what files we have so far"')
      conversation.push({
        role: 'user',
        content: 'List all the files in our project and tell me what we have created so far.'
      })

      const listResponse = await openai.chat.completions.create({
        model,
        messages: conversation,
        tools: projectTools.openai.definitions,
        temperature: 0.1,
        parallel_tool_calls: false
      })

      const listProcessed = await projectTools.openai.processToolCalls(listResponse)
      if (listProcessed.handled) {
        console.log('✅ File listing completed')
        operationsCompleted++
        
        // Add BOTH AI message and tool messages to conversation
        if (listResponse.choices[0]?.message) {
          conversation.push(listResponse.choices[0].message as any)
        }
        conversation.push(...listProcessed.toolMessages)
      }

      // Step 3: Read and edit the SAME file we created
      console.log('💬 User: "Read the sales report and add a customer satisfaction section"')
      conversation.push({
        role: 'user',
        content: 'Read the sales report file we just created and add a new section called "Customer Satisfaction" with a score of 4.7/5 and key feedback points.'
      })

      const readEditResponse = await openai.chat.completions.create({
        model,
        messages: conversation,
        tools: projectTools.openai.definitions,
        temperature: 0.2,
        parallel_tool_calls: false
      })

      const readEditProcessed = await projectTools.openai.processToolCalls(readEditResponse)
      if (readEditProcessed.handled) {
        console.log('✅ Report updated with satisfaction data')
        operationsCompleted++
        
        // Add BOTH AI message and tool messages to conversation
        if (readEditResponse.choices[0]?.message) {
          conversation.push(readEditResponse.choices[0].message as any)
        }
        conversation.push(...readEditProcessed.toolMessages)
      }

      // Step 4: Create customer database
      console.log('💬 User: "Create a customer database with sample data"')
      conversation.push({
        role: 'user',
        content: 'Create a customer database CSV file with these columns: customer_id, company_name, industry, monthly_revenue, status. Add 8 sample customers with realistic business data. Save it in the data folder as customers.csv'
      })

      const customerResponse = await openai.chat.completions.create({
        model,
        messages: conversation,
        tools: projectTools.openai.definitions,  // Using unified project tools
        temperature: 0.3,
        parallel_tool_calls: false
      })

      const customerProcessed = await projectTools.openai.processToolCalls(customerResponse)
      if (customerProcessed.handled) {
        console.log('✅ Customer database created at ai-workspace/data-analytics/customers.csv')
        operationsCompleted++
        
        // Add BOTH AI message and tool messages to conversation
        if (customerResponse.choices[0]?.message) {
          conversation.push(customerResponse.choices[0].message as any)
        }
        conversation.push(...customerProcessed.toolMessages)
      }

      // Step 5: Get metadata for specific file
      console.log('💬 User: "Check the details of our sales report file"')
      conversation.push({
        role: 'user',
        content: 'Get the file information for the sales report file we created - I want to see the version, size, and modification details.'
      })

      const metadataResponse = await openai.chat.completions.create({
        model,
        messages: conversation,
        tools: projectTools.openai.definitions,
        temperature: 0.1,
        parallel_tool_calls: false
      })

      const metadataProcessed = await projectTools.openai.processToolCalls(metadataResponse)
      if (metadataProcessed.handled) {
        console.log('✅ File metadata retrieved')
        operationsCompleted++
        
        // Add BOTH AI message and tool messages to conversation
        if (metadataResponse.choices[0]?.message) {
          conversation.push(metadataResponse.choices[0].message as any)
        }
        conversation.push(...metadataProcessed.toolMessages)
      }

    } else {
      // Manual tool execution - simulate step-by-step business workflow
      console.log('Step 1: Creating initial sales report...')
      
      // Step 1: Create sales report
      const salesReportResult = await client.writeFile(
        'reports/monthly-sales.md',
        '# Monthly Sales Report\n\n## Key Metrics\n- Revenue: $95,000\n- New Customers: 28\n\n## Next Steps\n- TBD',
        'text/markdown'
      )
      
      if (salesReportResult.status === 'success') {
        console.log('✅ Sales report created')
        operationsCompleted++
      }

      console.log('Step 2: Creating customer database...')
      
      // Step 2: Create customer data  
      const customerResult = await client.writeFile(
        'data/customers.csv',
        customerDataCsv,
        'text/csv'
      )
      
      if (customerResult.status === 'success') {
        console.log('✅ Customer database created')
        operationsCompleted++
      }

      console.log('Step 3: Reading customer data to get insights...')
      
      // Step 3: Read customer data to analyze it
      const readResult = await client.readFile('data/customers.csv')

      if (readResult.success) {
        const customerLines = readResult.data.split('\n').length - 1 || 0
        console.log(`✅ Analyzed customer data: ${customerLines} customers found`)
        operationsCompleted++
      }

      console.log('Step 4: Updating sales report with customer insights...')
      
      // Step 4: Edit sales report to add customer insights
      const editResult = await client.editFile(
        'reports/monthly-sales.md',
        '- Revenue: $95,000\n- New Customers: 28',
        `- Revenue: $95,000\n- New Customers: 28\n- Total Customers: ${readResult.success ? readResult.data.split('\n').length - 1 : 0}\n- Customer Retention: 92%`
      )

      if (editResult.success) {
        console.log('✅ Sales report updated with customer metrics')
        operationsCompleted++
      }

      console.log('Step 5: Checking what files we have...')
      
      // Step 5: List files to see our progress
      const listResult = await client.listFiles({ limit: 20 })

      if (listResult.success) {
        const fileCount = listResult.data.files.length || 0
        console.log(`✅ Current project has ${fileCount} files`)
        operationsCompleted++
      }

      console.log('Step 6: Getting report file details...')
      
      // Step 6: Get metadata of our updated report
      const metadataResult = await client.getFileMetadata('reports/monthly-sales.md')

      if (metadataResult.success) {
        const version = metadataResult.data.version || 1
        const size = formatFileSize(metadataResult.data.size || 0)
        console.log(`✅ Report details: v${version}, ${size}`)
        operationsCompleted++
      }

      console.log('Step 7: Checking report version history...')
      
      // Step 7: Check version history since we edited the file
      const versionsResult = await client.getFileVersions('reports/monthly-sales.md')

      if (versionsResult.success) {
        const versionCount = versionsResult.data.versions.length || 0
        console.log(`✅ Report has ${versionCount} versions (shows edit history)`)
        operationsCompleted++
      }
    }

    // Success summary
    const duration = Date.now() - startTime
    console.log()
    console.log('✅ Tools Integration Complete')
    console.log(`📊 Operations completed: ${operationsCompleted}`)
    console.log(`⏱️  Duration: ${duration}ms`)
    console.log(`🛠️  Tools available: ${projectTools.openai.definitions.length}`)
    console.log(`🤖 Integration mode: ${useAI ? 'AI-powered function calling' : 'Direct tool execution'}`)
    
    if (useAI) {
      console.log('💡 AI automatically selected appropriate tools for business tasks')
    } else {
      console.log('💡 Manual tool execution - perfect for custom AI frameworks')
    }

  } catch (error) {
    console.log()
    console.error('❌ Integration failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Integration patterns for custom AI frameworks:

/**
 * Pattern: AI Function Calling with Department-Based Organization
 */
export async function createScopedConversation(
  openai: OpenAI, 
  client: OpenFilesClient, 
  scope?: string,
  sessionId?: string
) {
  // Generate session ID if not provided for test isolation
  if (!sessionId) {
    sessionId = generateSessionId()
  }
  
  // Create unified tools for the conversation scope
  const conversationTools = new OpenFilesTools(scope ? client.withBasePath(scope) : client)
  
  return {
    async process(prompt: string) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        tools: conversationTools.openai.definitions,
        temperature: 0.3
      })
      
      const result = await conversationTools.openai.processToolCalls(response)
      return {
        ...result,
        scope,
        sessionId
      }
    }
  }
}

// Run the example if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  toolsIntegrationExample().catch(console.error)
}
#!/usr/bin/env tsx
/**
 * OpenAI Wrapper Integration Example
 * 
 * Shows how to integrate OpenFiles with OpenAI for AI-powered file operations.
 * Best for: AI apps, chatbots, natural language interfaces.
 */

import 'dotenv/config'
import OpenAI from '@openfiles-ai/sdk/openai'
import { generateSessionId, createSessionPaths, printSessionInfo } from './shared/session-utils.js'

async function openaiIntegrationExample() {
  console.log('🤖 OpenAI Wrapper Integration')

  // Step 1: Generate unique session for test isolation
  const sessionId = generateSessionId()
  const sessionPaths = createSessionPaths(sessionId, "openai-demo")
  printSessionInfo(sessionId, sessionPaths)

  // Step 2: Setup validation
  if (!process.env.OPENFILES_API_KEY || !process.env.OPENAI_API_KEY) {
    console.error('❌ Configure API keys in .env:')
    console.error('   OPENFILES_API_KEY, OPENAI_API_KEY')
    process.exit(1)
  }

  // Step 3: Initialize OpenAI wrapper with session-specific organized structure
  const ai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    openFilesApiKey: process.env.OPENFILES_API_KEY!,
    basePath: sessionPaths.aiGenerated  // Organize all AI files under session
  })

  const model = 'gpt-4o-mini' // Cost-effective model
  const startTime = Date.now()

  try {
    // AI-powered business file operations

    console.log('📊 Creating business reports with AI...')
    
    // Create scoped AI client for reports
    const reportsAI = ai.withBasePath('reports')
    await reportsAI.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: 'Create a monthly sales report for January 2024 with sample data. Include revenue of $125,000, 85 new customers, and top regions. Save as january-2024-sales.md'
      }],
      temperature: 0.3
    })
    console.log('✅ Sales report created at ai-generated/business-docs/reports/january-2024-sales.md')

    console.log('⚙️  Setting up configuration with AI...')
    
    // Create scoped AI client for config
    const configAI = ai.withBasePath('config')
    await configAI.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: 'Create an application configuration file with database settings (PostgreSQL on localhost), API rate limits (1000/hour), and feature flags for analytics. Save as app-config.json'
      }],
      temperature: 0.2
    })
    console.log('✅ Configuration created at ai-generated/business-docs/config/app-config.json')

    console.log('📈 Generating analytics data with AI...')
    
    // Create scoped AI client for analytics data
    const dataAI = ai.withBasePath('analytics')
    await dataAI.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: 'Create a CSV file with user analytics data for the past week. Include columns for date, user_id, page_views, session_duration, and actions_taken. Generate 20 sample records. Save as user-metrics.csv'
      }],
      temperature: 0.3
    })
    console.log('✅ Analytics data generated at ai-generated/business-docs/analytics/user-metrics.csv')

    console.log('🔍 Checking created files with AI...')
    const listResponse = await ai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: 'List all the files we have created and provide a brief summary of each file\'s purpose and size.'
      }]
    })
    console.log('✅ Files reviewed:', listResponse.choices[0]?.message?.content?.slice(0, 100) + '...' || 'No response')

    console.log('📝 Creating documentation with AI...')
    await ai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: 'Create a README.md file that documents all the files we created - the sales report, configuration, and analytics data. Explain what each file contains and how to use them. Save in the root directory.'
      }],
      temperature: 0.2
    })
    console.log('✅ Documentation created')

    // Success summary
    const duration = Date.now() - startTime
    console.log('✅ OpenAI Integration Complete')
    console.log(`⏱️  Duration: ${duration}ms`)
    console.log(`🤖 Model: ${model}`)
    console.log('💡 AI automatically created business files through natural language')
    console.log('📁 Created: Sales reports, configurations, analytics data, documentation')

  } catch (error) {
    console.log()
    console.error('❌ Integration failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Integration patterns for your AI applications:

/**
 * Pattern 1: Project-Based AI Organization
 */
export async function createProjectAI(
  apiKey: string,
  openFilesApiKey: string,
  baseUrl: string,
  projectName: string,
  sessionId?: string
) {
  // Generate session ID if not provided for test isolation
  if (!sessionId) {
    sessionId = generateSessionId()
  }
  
  // Create AI client scoped to specific project with session isolation
  const projectAI = new OpenAI({
    apiKey,
    openFilesApiKey,
    openFilesBaseUrl: baseUrl,
    basePath: `projects/session_${sessionId}/${projectName}`
  })
  
  return {
    // Create project documentation
    async createDocs(prompt: string) {
      const docsAI = projectAI.withBasePath('docs')
      return await docsAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    },
    
    // Create project reports and analysis
    async createReports(prompt: string) {
      const reportsAI = projectAI.withBasePath('reports')
      return await reportsAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    },
    
    // Create business policies and procedures
    async createPolicies(prompt: string) {
      const policiesAI = projectAI.withBasePath('policies')
      return await policiesAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    }
  }
}

/**
 * Pattern 2: Environment-Based AI Management
 */
export async function createEnvironmentAI(
  ai: OpenAI,
  environment: 'development' | 'staging' | 'production',
  sessionId?: string
) {
  // Generate session ID if not provided for test isolation
  if (!sessionId) {
    sessionId = generateSessionId()
  }
  
  // Create environment-specific AI client with session isolation
  const envAI = ai.withBasePath(`environments/session_${sessionId}/${environment}`)
  
  return {
    async deployConfig(config: any) {
      const configAI = envAI.withBasePath('config')
      return await configAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Create a ${environment} configuration file with settings: ${JSON.stringify(config)}. Save as app-config.json`
        }],
        temperature: 0.1
      })
    },
    
    async generateSecrets() {
      const secretsAI = envAI.withBasePath('secrets')
      return await secretsAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Generate secure environment variables for ${environment}. Save as .env.${environment}`
        }],
        temperature: 0.1
      })
    }
  }
}

/**
 * Pattern 3: Document Analysis and Summary
 */
export async function analyzeAndDocument(ai: OpenAI, filePath: string) {
  return await ai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Read the file at ${filePath}, analyze its content, and create a summary document explaining its key points and business value. Save the summary as docs/${filePath.replace('.', '-')}-summary.md`
    }],
    temperature: 0.2
  })
}

/**
 * Pattern 4: Configuration Management
 */
export async function updateConfig(ai: OpenAI, configPath: string, updates: string) {
  return await ai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Update the configuration file at ${configPath} with these changes: ${updates}. Maintain the existing format and structure.`
    }],
    temperature: 0.1
  })
}

// Run the example if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  openaiIntegrationExample().catch(console.error)
}
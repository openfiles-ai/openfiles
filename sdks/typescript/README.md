# OpenFiles - Persistent File Storage for AI Agents

OpenFiles gives your AI agents the ability to create, read, and manage files. Seamless OpenAI SDK integration with automatic file operations. Your AI agents can now save their work - reports, code, documents, data - with zero infrastructure setup.

## 🚀 Quick Start

```bash
npm install @openfiles-ai/sdk
```

### OpenAI Integration
```typescript
// Before: import OpenAI from 'openai'
// After:  import OpenAI from '@openfiles-ai/sdk/openai'

const ai = new OpenAI({
  apiKey: 'sk_your_openai_key',           // Same as before
  openFilesApiKey: 'oa_your_key',    // Add this
  basePath: 'company/reports'             // Optional: organize files
})

// Everything else works exactly the same!
const response = await ai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Generate quarterly business report' }],
})

// AI creates the file and responds with confirmation
console.log(response.choices[0].message.content)
// "I've generated a comprehensive Q1 2025 business report and saved it as company/reports/quarterly-report-q1-2025.md. The report includes financial metrics, growth analysis, and strategic recommendations."
```

## 📦 Package Structure

The SDK provides three distinct layers for different use cases:

| Layer | Import Path | Use Case | Best For |
|-------|-------------|----------|----------|
| **OpenAI** | `@openfiles-ai/sdk/openai` | OpenAI SDK integration | Existing OpenAI codebases |
| **Tools** | `@openfiles-ai/sdk/tools` | Framework-agnostic tools | Any AI framework (Anthropic, Cohere, etc.) |
| **Core** | `@openfiles-ai/sdk/core` | Direct API client | Custom integrations, frameworks |

## 📄 File Type Support

| File Category | Core Layer | Tools Layer | OpenAI Layer |
|---------------|------------|-------------|--------------|
| **Text Files** | ✅ | ✅ | ✅ |
| **Binary Files** | ✅ | 🚧 Coming Soon | 🚧 Coming Soon |

### Supported File Types

**✅ Text Files (All Layers)**
- Documents: `.md`, `.txt`, `.rtf`
- Code: `.js`, `.ts`, `.py`, `.java`, `.html`, `.css`
- Data: `.json`, `.csv`, `.yaml`, `.xml`, `.toml`
- Config: `.env`, `.ini`, `.conf`

**✅ Binary Files (Core Layer Only)**
- Images: `.png`, `.jpg`, `.gif`, `.webp`, `.bmp`, `.svg`
- Audio: `.mp3`, `.wav`, `.ogg`
- Documents: `.pdf`
- Archives: `.zip`

*Binary file support for Tools and OpenAI layers coming soon.*

---

## 🤖 OpenAI Layer (`@openfiles-ai/sdk/openai`)

Seamless OpenAI client integration with automatic file operations.

### Features
- ✅ **Zero code changes** - only change import path
- ✅ Automatic tool injection and execution
- ✅ Full OpenAI TypeScript compatibility
- ✅ Enhanced callbacks for monitoring
- ✅ Preserves all original OpenAI functionality

### Usage

**Before (using OpenAI directly):**
```typescript
import OpenAI from 'openai'

const ai = new OpenAI({
  apiKey: 'sk_your_openai_key'
})

const response = await ai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Create a quarterly business report document' }],
  tools: [/* manually define file tools */]
})

// Manually handle tool calls...
if (response.choices[0].message.tool_calls) {
  // Execute each tool call manually
  // Handle errors and retries
  // Make another API call with tool results
  // Complex multi-step workflow
}
```

**After (using OpenFiles):**
```typescript
import OpenAI from '@openfiles-ai/sdk/openai'  // Only this changes!

const ai = new OpenAI({
  apiKey: 'sk_your_openai_key',           // Same
  openFilesApiKey: 'oa_your_key',    // Add this
  basePath: 'business/reports'            // Optional: organize files
})

const response = await ai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Create a quarterly business report document' }],
  // tools auto-injected, sequential execution for reliability
})

// AI responds with confirmation of completed file operations
console.log(response.choices[0].message.content)
// Example: "I've created the quarterly business report document and saved it as business/reports/quarterly-report-q1-2025.md..."
```

### Enhanced Configuration

```typescript
const ai = new OpenAI({
  // All standard OpenAI options work
  apiKey: 'sk_your_openai_key',
  
  // OpenFiles additions
  openFilesApiKey: 'oa_your_key',
  
  // Optional monitoring callbacks
  onFileOperation: (op) => {
    console.log(`📁 ${op.action}: ${op.path}`)
  },
  onToolExecution: (exec) => {
    console.log(`🔧 ${exec.function} (${exec.duration}ms)`)
  },
  onError: (error) => {
    console.error('❌ Error:', error.message)
  }
})
```

### Organized File Operations with BasePath

Create structured file organization for your AI operations:

```typescript
import OpenAI from '@openfiles-ai/sdk/openai'

// Option 1: Constructor BasePath (all operations scoped)
const projectAI = new OpenAI({
  apiKey: 'sk_your_openai_key',
  openFilesApiKey: 'oa_your_key',
  basePath: 'projects/ecommerce-site',
  onFileOperation: (op) => console.log(`📁 ${op.action}: ${op.path}`)
})

// Option 2: Create scoped clients for different areas
const mainAI = new OpenAI({
  apiKey: 'sk_your_openai_key',
  openFilesApiKey: 'oa_your_key'
})

const frontendAI = mainAI.withBasePath('frontend')
const backendAI = mainAI.withBasePath('backend')  
const docsAI = mainAI.withBasePath('documentation')

// Each AI client operates in its own file namespace
const response1 = await frontendAI.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Create React components for the header' }]
})
// Creates files under 'frontend/' automatically

const response2 = await backendAI.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Generate Python API models' }]
})
// Creates files under 'backend/' automatically

const response3 = await docsAI.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Write API documentation' }]
})
// Creates files under 'documentation/' automatically
```

### Multi-Environment Setup

Organize files by environment with ease:

```typescript
const ai = new OpenAI({
  apiKey: 'sk_your_openai_key',
  openFilesApiKey: 'oa_your_key'
})

// Create environment-specific AI clients
const devAI = ai.withBasePath('environments/development')
const stagingAI = ai.withBasePath('environments/staging')
const prodAI = ai.withBasePath('environments/production')

// Generate environment-specific configurations
const devResponse = await devAI.chat.completions.create({
  model: 'gpt-4',
  messages: [{
    role: 'user',
    content: 'Create development database configuration with debug settings'
  }]
})
// Files created under 'environments/development/'

const prodResponse = await prodAI.chat.completions.create({
  model: 'gpt-4', 
  messages: [{
    role: 'user',
    content: 'Create production database configuration with optimized settings'
  }]
})
// Files created under 'environments/production/'
```

### Advanced BasePath Patterns

Combine constructor and scoped basePaths for complex workflows:

```typescript
// Start with a company-wide basePath
const companyAI = new OpenAI({
  apiKey: 'sk_your_openai_key',
  openFilesApiKey: 'oa_your_key',
  basePath: 'acme-corp'
})

// Create team-specific clients
const engineeringAI = companyAI.withBasePath('engineering')
const marketingAI = companyAI.withBasePath('marketing')

// Create project-specific clients within teams  
const mobileTeam = engineeringAI.withBasePath('mobile-app')
const webTeam = engineeringAI.withBasePath('web-platform')

// AI operations create organized file structures
await mobileTeam.chat.completions.create({
  model: 'gpt-4',
  messages: [{ 
    role: 'user',
    content: 'Generate React Native component library with TypeScript definitions'
  }]
})
// Creates files under 'acme-corp/engineering/mobile-app/'

await webTeam.chat.completions.create({
  model: 'gpt-4',
  messages: [{
    role: 'user', 
    content: 'Create Next.js application with authentication system'
  }]
})
// Creates files under 'acme-corp/engineering/web-platform/'
```

---

## 🛠️ Tools Layer (`@openfiles-ai/sdk/tools`)

Framework-agnostic tool definitions compatible with any AI platform that supports tool calling.

### Features
- ✅ OpenAI-compatible tool definitions
- ✅ Works with any AI framework (Anthropic Claude, Cohere, etc.)
- ✅ Automatic tool execution
- ✅ Selective processing (only handles OpenFiles tools)
- ✅ Rich error handling and callbacks

### Usage
```typescript
import { OpenFilesClient } from '@openfiles-ai/sdk/core'
import { OpenFilesTools } from '@openfiles-ai/sdk/tools'

const client = new OpenFilesClient({ apiKey: 'oa_your_key' })
const tools = new OpenFilesTools(client)

// Use with any AI framework
const response = await yourAIClient.chat({
  messages: [{ role: 'user', content: 'Create a company policy document' }],
  tools: [
    ...tools.definitions,  // OpenFiles file tools
    ...myCustomTools       // Your other tools
  ]
})

// Process only OpenFiles tools
const processed = await tools.processToolCalls(response)
if (processed.handled) {
  console.log(`Processed ${processed.results.length} file operations`)
  processed.results.forEach(result => {
    if (result.status === 'success') {
      console.log(`✅ ${result.function}: ${result.data?.path || 'completed'}`)
    }
  })
}
```

### BasePath Organization

Organize your tools with base paths for better file structure:

```typescript
import { OpenFilesClient } from '@openfiles-ai/sdk/core'
import { OpenFilesTools } from '@openfiles-ai/sdk/tools'

const client = new OpenFilesClient({ apiKey: 'oa_your_key' })

// Create scoped tools for different areas
const projectTools = new OpenFilesTools(client, 'projects/website')
const configTools = new OpenFilesTools(client, 'config')
const logsTools = new OpenFilesTools(client, 'logs')

// Or create tools from existing client
const mainTools = new OpenFilesTools(client)
const devTools = mainTools.withBasePath('environments/development')
const prodTools = mainTools.withBasePath('environments/production')

// Use scoped tools with AI frameworks
const response = await yourAIClient.chat({
  messages: [{ role: 'user', content: 'Create development config files' }],
  tools: devTools.definitions  // All file operations will be under 'environments/development/'
})

await devTools.processToolCalls(response)
```

### Multi-Framework Example

Use Tools layer with different AI frameworks:

```typescript
// With Anthropic Claude
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: 'sk_ant_...' })

const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  messages: [{ role: 'user', content: 'Create API documentation files' }],
  tools: projectTools.definitions
})
await projectTools.processToolCalls(response)

// With OpenAI
import OpenAI from 'openai'
const openai = new OpenAI({ apiKey: 'sk_...' })

const response2 = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Generate test files' }],
  tools: projectTools.definitions
})
await projectTools.processToolCalls(response2)

// Both agents work in the same file namespace
```

### Tool Definitions

| Tool | Description | Use Case |
|------|-------------|----------|
| `write_file` | Create new file | AI generates reports, documentation, configurations from scratch |
| `read_file` | Read and display file | AI reviews existing content before making changes or answering questions |
| `edit_file` | Modify specific text | AI fixes typos, updates values, refactors specific sections |
| `list_files` | Browse directory | AI explores document structure to understand available files |
| `append_to_file` | Add content to end | AI adds new entries to logs, lists, or ongoing documents |
| `overwrite_file` | Replace entire content | AI completely rewrites outdated files with new content |
| `get_file_metadata` | Get file info only | AI checks file size, version, modification dates for decisions |
| `get_file_versions` | Access file history | AI reviews changes over time or reverts to previous versions |

---

## 🔧 Core Layer (`@openfiles-ai/sdk/core`)

Direct API client for OpenFiles platform with direct file operations.

### Features
- ✅ **8 file operations** (write, read, edit, list, append, overwrite, getMetadata, getVersions)
- ✅ **Dedicated metadata & versioning methods** with specialized interfaces
- ✅ Version control with automatic versioning
- ✅ Path conventions (no leading slashes, forward slashes only)
- ✅ TypeScript-first with full type safety
- ✅ Comprehensive error handling with logging

### Usage

```typescript
import { OpenFilesClient } from '@openfiles-ai/sdk/core'

const client = new OpenFilesClient({
  apiKey: process.env.OPENFILES_API_KEY!,
  basePath: 'company/reports'  // Organize all reports under this path
})

// Write a file (creates 'company/reports/quarterly-report.md')
const result = await client.writeFile({
  path: 'quarterly-report.md',
  content: '# Q1 2025 Report\n\nRevenue increased 15%...',
  contentType: 'text/markdown'
})

// Read the file back
const content = await client.readFile({
  path: 'quarterly-report.md'
})

// Edit the file
await client.editFile({
  path: 'quarterly-report.md',
  oldString: 'Revenue increased 15%',
  newString: 'Revenue increased 18%'
})

// Get file metadata
const metadata = await client.getFileMetadata({
  path: 'quarterly-report.md'
})
console.log(`File version: ${metadata.version}, Size: ${metadata.size} bytes`)

// Create scoped client for analytics
const analyticsClient = client.withBasePath('analytics')
await analyticsClient.writeFile({
  path: 'user-metrics.json',  // Creates 'company/reports/analytics/user-metrics.json'
  content: '{"users": 1250, "growth": "15%"}',
  contentType: 'application/json'
})
```

---

## 🔄 Which Layer Should I Use?

| | OpenAI Layer | Tools Layer | Core Layer |
|--|-------------|-------------|-----------|
| **👥 Best For** | **Existing OpenAI apps** | Multi-framework developers | Custom integrations |
| **⭐ Difficulty** | **⭐ Easiest** | ⭐⭐ Medium | ⭐⭐⭐ Advanced |
| **🔧 Setup** | **Change import only** | Add tools + handle calls | Direct API integration |
| **🤖 AI Framework** | **OpenAI (Others coming soon)** | Any framework | Direct API |
| **⚙️ Tool Management** | **Fully automatic** | Manual processing | No tools (direct API) |
| **🎛️ Control Level** | **Plug & play** | Moderate control | Full control |
| **📁 File Types** | **Text files** | Text files | **Text + Binary** |

---

## 📋 Complete Examples

### Example 1: Document Generator (OpenAI Layer)
```typescript
import OpenAI from '@openfiles-ai/sdk/openai'

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  openFilesApiKey: process.env.OPENFILES_API_KEY!,
  basePath: 'company/executive-reports',  // Organize executive documents
  onFileOperation: (op) => console.log(`📄 ${op.action}: ${op.path}`)
})

const response = await ai.chat.completions.create({
  model: 'gpt-4',
  messages: [{
    role: 'user',
    content: 'Create a comprehensive annual business report for 2025'
  }]
})

// AI creates the file and confirms what it built
console.log(response.choices[0].message.content)
// "I've created a comprehensive annual business report for 2025 and saved it as company/executive-reports/annual-business-report-2025.md. It includes financial performance, market analysis, strategic initiatives, and future outlook."
```

### Example 2: Multi-Agent Collaboration (Tools Layer)
```typescript
import { OpenFilesClient } from '@openfiles-ai/sdk/core'
import { OpenFilesTools } from '@openfiles-ai/sdk/tools'

const client = new OpenFilesClient({
  apiKey: process.env.OPENFILES_API_KEY!
})

// Create scoped tools for HR documents
const hrTools = new OpenFilesTools(client, 'company/hr-documents')

// AI Agent 1 (Claude) creates initial content
const claudeResponse = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  messages: [{ role: 'user', content: 'Create employee handbook file' }],
  tools: hrTools.definitions
})
await hrTools.processToolCalls(claudeResponse)

// AI Agent 2 (OpenAI) enhances the content  
const openaiResponse = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Review and improve the employee handbook file' }],
  tools: hrTools.definitions
})
await hrTools.processToolCalls(openaiResponse)

// Both agents work on shared files under 'company/hr-documents/' seamlessly
```

### Example 3: Direct API Usage (Core Layer)
```typescript
import { OpenFilesClient } from '@openfiles-ai/sdk/core'

const client = new OpenFilesClient({
  apiKey: process.env.OPENFILES_API_KEY!,
  basePath: 'company/financial-data'  // Organize all financial reports
})

// Example: Custom function that generates quarterly business reports
async function generateQuarterlyReport(quarter: string, year: number) {
  // Create scoped client for this specific quarter
  const quarterClient = client.withBasePath(`${year}/Q${quarter}`)
  
  // Create quarterly report structure
  const reportFile = await quarterClient.writeFile({
    path: 'quarterly-report.md',
    content: `# Q${quarter} ${year} Quarterly Report\n\n## Executive Summary\nRevenue increased 15% this quarter...\n\n## Key Metrics\n- Sales: $2.3M\n- Growth: +15%\n- Customer Satisfaction: 94%`,
    contentType: 'text/markdown'
  })
  
  const metricsFile = await quarterClient.writeFile({
    path: 'metrics-data.txt',
    content: 'Revenue: $2,300,000\nCustomers: 1,250\nChurn Rate: 3.2%\nNPS Score: 72',
    contentType: 'text/plain'
  })
  
  // List created report files
  const result = await quarterClient.listFiles({
    directory: '/',
    limit: 10
  })
  
  console.log(`Generated ${result.files.length} report files out of ${result.total} total`)
  
  // Get metadata for the main report
  const metadata = await quarterClient.getFileMetadata({
    path: 'quarterly-report.md'
  })
  
  return { files: result.files, metadata }
}

const reports = await generateQuarterlyReport('1', 2025)
console.log('Report files:', reports.files.map(f => f.path))
// Output: ['company/financial-data/2025/Q1/quarterly-report.md', 'company/financial-data/2025/Q1/metrics-data.txt']
console.log('Main report version:', reports.metadata.version)
// Output: 1
```

---

## 🔑 Authentication

Get your API key from [OpenFiles Console](https://console.openfiles.ai):

1. Sign up with GitHub OAuth
2. Generate API key in Settings
3. Use format: `oa_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

```typescript
// Environment variables (recommended)
const client = new OpenFilesClient({
  apiKey: process.env.OPENFILES_API_KEY!,
  basePath: 'my-project'  // Optional: organize files by project
})

// Or direct configuration
const client = new OpenFilesClient({
  apiKey: 'oa_your_32_character_api_key_here',
  basePath: 'development/prototypes'  // Optional: organize by environment
})
```

---

## 🎯 Best Practices

### File Paths
- Use simple paths: `reports/quarterly-report-q1.md` ✅
- No leading slashes: `/reports/quarterly-report.md` ❌
- Use forward slashes on all platforms
- Keep paths descriptive and organized

### Error Handling
```typescript
const client = new OpenFilesClient({
  apiKey: 'oa_your_key',
  basePath: 'company/policies'  // Organize policy documents
})

try {
  await client.writeFile({ 
    path: 'employee-handbook.md', 
    content: 'Employee handbook content...',
    contentType: 'text/markdown'
  })
} catch (error) {
  if (error.status === 409) {
    // File already exists at 'company/policies/employee-handbook.md'
    // Use editFile or overwriteFile instead
    await client.overwriteFile({
      path: 'employee-handbook.md',
      content: 'Updated employee handbook content...'
    })
  }
  console.error('Operation failed:', error.message)
}
```

### Performance
- Use `listFiles()` with appropriate limits
- Leverage version control instead of frequent overwrites  
- Cache metadata when possible
- Use streaming for large files

### Security
- Store API keys in environment variables
- Use Row Level Security (RLS) policies
- Validate file paths and content types
- Monitor API usage through callbacks

---

## 🗺️ Roadmap

### **🚧 Coming Soon**
- **Delete Operation** - Remove files and folders
- **Anthropic Claude Support** - Native drop-in replacement for Claude
- **Google Gemini Support** - Native drop-in replacement for Gemini
- **Semantic Search** - AI-powered file discovery
- **Binary File Support for Tools & OpenAI Layers** - Currently only Core layer supports binary files

### **🔮 Future Features**
- **More AI Providers** - Cohere, Mistral, and local models
- **Real-time Sync** - WebSocket support for live file updates
- **File Sharing** - Share files between projects and teams
- **Multi-agent Workflows** - Advanced agent coordination
- **Plugin Ecosystem** - Community-built integrations

### **🌟 Long-term Vision**
- **Enterprise Features** - Team management, audit logs, compliance
- **Multi-cloud Support** - AWS S3, Google Cloud Storage, Azure Blob
- **Mobile SDKs** - React Native and Flutter support

---

## 🗂️ Path Organization with BasePath

The SDK provides multiple ways to organize your files using base paths. This is especially useful for structuring files by project, environment, or team.

### 🎯 Three BasePath Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Constructor BasePath** | Global organization | All files under `projects/website/` |
| **Scoped Client** | Team/feature isolation | Create focused clients for different areas |
| **Per-Operation** | Temporary overrides | One-off files in different locations |

### 📁 Pattern 1: Constructor BasePath

Set a global base path that applies to all operations:

```typescript
import { OpenFilesClient } from '@openfiles-ai/sdk/core'

const client = new OpenFilesClient({
  apiKey: 'oa_your_key',
  basePath: 'projects/website'  // All operations prefixed with this
})

// This creates 'projects/website/config.json'
await client.writeFile({
  path: 'config.json',
  content: '{"theme": "dark"}'
})

// This reads 'projects/website/assets/logo.png'
const logo = await client.readFile({
  path: 'assets/logo.png'
})
```

### 🔧 Pattern 2: Scoped Clients

Create focused clients for different areas of your project:

```typescript
const client = new OpenFilesClient({ apiKey: 'oa_your_key' })

// Create scoped clients for different areas
const frontendClient = client.withBasePath('projects/frontend')
const backendClient = client.withBasePath('projects/backend')
const docsClient = client.withBasePath('documentation')

// Each client operates in its own namespace
await frontendClient.writeFile({
  path: 'components/Header.tsx',  // → 'projects/frontend/components/Header.tsx'
  content: 'export function Header() { ... }'
})

await backendClient.writeFile({
  path: 'models/User.py',         // → 'projects/backend/models/User.py'  
  content: 'class User: ...'
})

await docsClient.writeFile({
  path: 'api-guide.md',           // → 'documentation/api-guide.md'
  content: '# API Guide\n...'
})
```

### 🔗 Chaining BasePaths

Build complex hierarchies by chaining `withBasePath()` calls:

```typescript
const client = new OpenFilesClient({ apiKey: 'oa_your_key' })

// Chain multiple levels
const configClient = client
  .withBasePath('projects')
  .withBasePath('website')
  .withBasePath('config')

// This creates 'projects/website/config/database.json'
await configClient.writeFile({
  path: 'database.json',
  content: '{"host": "localhost", "port": 5432}'
})

// You can also chain from constructor basePath
const globalClient = new OpenFilesClient({
  apiKey: 'oa_your_key',
  basePath: 'company'
})

const teamClient = globalClient.withBasePath('engineering').withBasePath('frontend')

// This creates 'company/engineering/frontend/roadmap.md'
await teamClient.writeFile({
  path: 'roadmap.md',
  content: '# Frontend Roadmap 2025'
})
```

### ⚡ Pattern 3: Per-Operation BasePath

Override paths for specific operations:

```typescript
const client = new OpenFilesClient({
  apiKey: 'oa_your_key',
  basePath: 'main-project'  // Default base path
})

// Regular operation uses default basePath → 'main-project/readme.md'
await client.writeFile({
  path: 'readme.md',
  content: '# Main Project'
})

// Override for this specific operation → 'temp/backup/data.json'
await client.writeFile({
  basePath: 'temp/backup',  // Overrides 'main-project'
  path: 'data.json',
  content: '{"backup": true}'
})

// Back to default → 'main-project/config.json'  
await client.writeFile({
  path: 'config.json',
  content: '{"version": "1.0"}'
})
```

### 🏆 BasePath Priority System

When multiple basePaths are specified, they follow this priority:

**Per-Operation > Scoped Client > Constructor**

```typescript
const client = new OpenFilesClient({
  apiKey: 'oa_your_key',
  basePath: 'constructor-path'        // Priority 3 (lowest)
})

const scopedClient = client.withBasePath('scoped-path')  // Priority 2

await scopedClient.writeFile({
  basePath: 'operation-path',         // Priority 1 (highest)
  path: 'file.txt',
  content: 'Hello World'
})

// Final path: 'operation-path/file.txt'
// (operation-path overrides scoped-path and constructor-path)
```

### 🎯 Real-World Examples

#### Multi-Environment Setup
```typescript
const client = new OpenFilesClient({ apiKey: 'oa_your_key' })

// Environment-specific clients
const devClient = client.withBasePath('environments/development')
const stagingClient = client.withBasePath('environments/staging') 
const prodClient = client.withBasePath('environments/production')

// Deploy configs to different environments
await devClient.writeFile({
  path: 'app-config.json',
  content: '{"debug": true, "api": "dev.api.com"}'
})

await prodClient.writeFile({
  path: 'app-config.json',  
  content: '{"debug": false, "api": "api.com"}'
})
```

#### Team Collaboration
```typescript
// Different teams working on the same project
const projectClient = client.withBasePath('ecommerce-platform')

const frontendTeam = projectClient.withBasePath('frontend')
const backendTeam = projectClient.withBasePath('backend')
const designTeam = projectClient.withBasePath('design-system')

// Each team works in isolation
await frontendTeam.writeFile({
  path: 'components/ProductCard.tsx',
  content: '// Frontend component'
})

await backendTeam.writeFile({
  path: 'services/PaymentService.py',
  content: '# Backend service'  
})

await designTeam.writeFile({
  path: 'tokens/colors.json',
  content: '{"primary": "#007bff"}'
})
```

#### AI Agent Orchestration
```typescript
// Different AI agents working with organized file structure
const client = new OpenFilesClient({ apiKey: 'oa_your_key' })

// Agent 1: Content Creator
const contentAgent = client.withBasePath('content-generation')
await contentAgent.writeFile({
  path: 'blog-posts/ai-trends-2025.md',
  content: '# AI Trends in 2025\n...'
})

// Agent 2: Code Generator  
const codeAgent = client.withBasePath('code-generation')
await codeAgent.writeFile({
  path: 'components/AIWidget.tsx',
  content: 'export function AIWidget() { ... }'
})

// Agent 3: Documentation
const docsAgent = client.withBasePath('documentation')
await docsAgent.writeFile({
  path: 'user-guide.md', 
  content: '# User Guide\n...'
})
```

### ✅ BasePath Best Practices

1. **Consistent Naming**: Use consistent path naming conventions
   ```typescript
   // Good
   const webClient = client.withBasePath('projects/website')
   const mobileClient = client.withBasePath('projects/mobile-app')
   
   // Avoid inconsistent naming
   const webClient = client.withBasePath('web_stuff')
   const mobileClient = client.withBasePath('MobileProject')
   ```

2. **Logical Hierarchy**: Structure paths to match your project organization
   ```typescript
   // Mirrors typical project structure
   const srcClient = client.withBasePath('src')
   const testsClient = client.withBasePath('tests')
   const docsClient = client.withBasePath('docs')
   ```

3. **Environment Separation**: Use basePaths to separate environments
   ```typescript
   const env = process.env.NODE_ENV || 'development'
   const envClient = client.withBasePath(`env/${env}`)
   ```

4. **Team Boundaries**: Create clear team workspaces
   ```typescript
   const team = process.env.TEAM_NAME
   const teamClient = client.withBasePath(`teams/${team}`)
   ```

---

## 📖 API Reference

For complete API documentation, see the examples and interfaces in this README.

## 🤝 Support

- [GitHub Issues](https://github.com/openfiles-ai/openfiles/issues)
- [Documentation](https://github.com/openfiles-ai/openfiles/tree/main/sdks/typescript)
- [Email Support](mailto:contact@openfiles.ai)

---

**Built for AI agents, by AI enthusiasts** 🤖✨

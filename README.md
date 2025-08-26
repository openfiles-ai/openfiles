# OpenFiles

**File storage built for AI agents**

OpenFiles provides persistent file operations with built-in semantic search, enabling AI agents to save, search, and iterate on files across sessions. AI agents can share files with each other and humans seamlessly. Replace complex tool stacks (S3 + Vector DB + Custom APIs) with a single AI-native platform.

> **🚀 MVP Progress**: Epic 1-5 Complete! Full authentication system, TypeScript SDK with 3-tier architecture, professional dashboard, and Coming Soon landing page are fully implemented. Core AI file operations with version control ready for production. The MVP foundation is **59% complete** (145/245 tasks).

## 🎯 Problem

AI agents create massive amounts of content but can't persist or organize it effectively:
- AI-generated content disappears between sessions
- No way for multiple AI agents to collaborate on shared files
- No intelligent search across AI-generated content by meaning
- Complex integration of multiple tools (S3, Vector DB, Custom APIs)
- Weeks of development time for basic AI file operations

## ✨ Solution

```javascript
// Instead of this complexity...
await s3.putObject(params)
await vectorDB.upsert(embeddings) 
await db.insertMetadata(fileInfo)
// + weeks of custom development

// Just this:
import { OpenFilesClient } from '@openfiles-ai/sdk/core'

const client = new OpenFilesClient({
  apiKey: 'oa_live_...',
  baseUrl: 'https://your-api-url.com'
})

// AI Agent 1 creates files
await client.writeFile({ path: 'components/Button.tsx', content: aiGeneratedCode })

// AI Agent 2 continues the work in same session or later
await client.readFile({ path: 'components/Button.tsx' }) // Gets Agent 1's work
await client.editFile({ path: 'components/Button.tsx', oldString: oldCode, newString: improvedCode })

// Human reviews and AI Agent 3 takes over
await client.listFiles({ directory: 'components/' }) // See all shared files
```

## 🔧 Core Features

### 8 Core File Operations
- **`writeFile(path, content)`** - Create new files with automatic versioning
- **`readFile(path)`** - Read existing files for context
- **`editFile(path, oldString, newString)`** - Modify files iteratively
- **`appendToFile(path, content)`** - Add content to file end
- **`overwriteFile(path, content)`** - Replace entire file content
- **`listFiles(options)`** - Browse file structure with filtering
- **`getFileMetadata(path)`** - Get file information without content
- **`getFileVersions(path)`** - Access complete version history

*Note: File deletion is human-only through console for AI safety*

### Built-in Capabilities
- **Cross-agent collaboration** - Multiple AI agents can work on shared files seamlessly
- **Automatic version control** - Every change creates a new version with history
- **Cross-session persistence** - AI agents resume work across conversations
- **Semantic search foundation** - Infrastructure ready for intelligent content discovery (coming soon)
- **User-controlled organization** - Flexible S3-style path system for file organization
- **Complete metadata** - Track file sizes, types, creation and modification dates
- **Activity tracking** - Monitor AI agent and user file operations

## 🚀 Quick Start

### Available SDKs

#### TypeScript / JavaScript
```bash
npm install @openfiles-ai/sdk
```
[📖 Complete TypeScript Documentation](./sdks/typescript/)

#### Python
```bash
pip install openfiles-ai
```
[📖 Complete Python Documentation](./sdks/python/)

### Installation (Development)
```bash
# Clone repository
git clone https://github.com/openfiles-ai/openfiles
cd openfiles
pnpm install
pnpm build
```

### SDK Installation (Production)
```bash
# TypeScript/JavaScript
npm install @openfiles-ai/sdk

# Python  
pip install openfiles-ai
```

### Basic Usage

#### TypeScript
```typescript
import { OpenFilesClient } from '@openfiles-ai/sdk/core'

const client = new OpenFilesClient({
  apiKey: process.env.OPENFILES_API_KEY,
  baseUrl: 'https://your-project.supabase.co/functions/v1/api'
})

// AI agent creates a project structure
await client.writeFile({ path: 'src/App.tsx', content: reactAppCode })
await client.writeFile({ path: 'src/components/Header.tsx', content: headerCode })
await client.writeFile({ path: 'package.json', content: packageConfig })

// Later session - Different AI agent continues building
const existingApp = await client.readFile({ path: 'src/App.tsx' })
await client.editFile({ path: 'src/App.tsx', oldString: oldRouting, newString: newRouting })

// Browse shared file structure
const components = await client.listFiles({ directory: 'src/components' })
// Future: Semantic search for related files
// const authFiles = await client.semanticSearch({ query: 'authentication logic' })
```

## 📚 Documentation

### SDK Documentation
- [📖 TypeScript SDK](./sdks/typescript/) - Complete TypeScript/JavaScript documentation
- [📖 Python SDK](./sdks/python/) - Complete Python documentation

## 📚 API Documentation

### HTTP Status Codes

The OpenFiles API uses standard HTTP status codes to indicate the success or failure of requests:

| Status | Code | Description | Example |
|--------|------|-------------|---------|
| **200** | `OK` | Request succeeded | Successful file read/write |
| **400** | `Bad Request` | Validation error - invalid input | Missing required fields, invalid formats |
| **401** | `Unauthorized` | Authentication failure | Invalid API key, expired token |
| **403** | `Forbidden` | Authenticated but not allowed | Quota exceeded, permission denied |
| **404** | `Not Found` | Resource doesn't exist | File or user not found |
| **409** | `Conflict` | State conflict | File already exists |
| **413** | `Payload Too Large` | Request body too large | File content exceeds limit |
| **415** | `Unsupported Media Type` | Invalid content type | Unsupported file format |
| **422** | `Unprocessable Entity` | Business rule violation | String not found in edit operation |
| **429** | `Too Many Requests` | Rate limit exceeded | Too many API calls |
| **500** | `Internal Server Error` | Server error | Database or system failure |
| **503** | `Service Unavailable` | Service temporarily down | Maintenance or overload |

### Error Response Format

All error responses follow a consistent structure:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "SPECIFIC_ERROR_CODE",
  "details": {
    // Optional additional context
    "field": "path",
    "hint": "Path must not contain '..' for security"
  }
}
```

### Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `INVALID_REQUEST` | 400 | Malformed request |
| `MISSING_AUTH` | 401 | No authentication provided |
| `INVALID_API_KEY` | 401 | API key is invalid |
| `EXPIRED_TOKEN` | 401 | Authentication token expired |
| `PERMISSION_DENIED` | 403 | Not authorized for this action |
| `FILE_NOT_FOUND` | 404 | Requested file doesn't exist |
| `USER_NOT_FOUND` | 404 | User account not found |
| `ALREADY_EXISTS` | 409 | Resource already exists |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |
| `BUSINESS_RULE_VIOLATION` | 422 | Valid input but operation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Development & Testing
```typescript
// For local development and testing
const client = new OpenFilesClient({
  apiKey: 'oa_test123456789012345678901234567890', // Pre-configured test API key
  baseUrl: 'http://127.0.0.1:54321/functions/v1/api'
})

// Test with pre-seeded data
const files = await client.listFiles() // Returns sample files
const readme = await client.readFile({ path: 'README.md' }) // Pre-existing test file
```

#### Python
```python
from openfiles_ai import OpenFilesClient

client = OpenFilesClient(
    api_key=os.getenv('OPENFILES_API_KEY'),
    base_path='projects/python-app'  # Optional: organize files
)

# AI agent creates a project structure
await client.write_file(path='src/app.py', content=python_app_code)
await client.write_file(path='requirements.txt', content=requirements)

# Later session - Different AI agent continues building
existing_app = await client.read_file(path='src/app.py')
await client.edit_file(path='src/app.py', old_string=old_code, new_string=new_code)
```

### AI Agent Integration

#### OpenAI Integration (TypeScript)
```typescript
import OpenAI from '@openfiles-ai/sdk/openai'

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  openFilesApiKey: process.env.OPENFILES_API_KEY,
  basePath: 'projects/react-app'  // Optional: organize files
})

const response = await ai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Build a React app with authentication' }]
})
// AI can now persist, search, and manage files across sessions automatically!
```

#### OpenAI Integration (Python)
```python
from openfiles_ai import OpenAI

ai = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY'),
    openfiles_api_key=os.getenv('OPENFILES_API_KEY'),
    base_path='projects/fastapi-app'  # Optional: organize files
)

response = await ai.chat.completions.create(
    model='gpt-4',
    messages=[{'role': 'user', 'content': 'Build a Python FastAPI app'}]
)
# AI can now persist, search, and manage files across sessions automatically!
```

## 📁 Current Implementation

The MVP has **comprehensive core functionality** with Epic 1-5 complete, including full authentication system, TypeScript SDK, professional dashboard, and Coming Soon landing page.

### Available Operations (Production Ready)
- ✅ **`writeFile(params)`** - Create/update files with automatic versioning
- ✅ **`readFile(params)`** - Read file content (with version support)
- ✅ **`editFile(params)`** - Edit files with string replacement
- ✅ **`appendToFile(params)`** - Add content to file end
- ✅ **`overwriteFile(params)`** - Replace entire file content
- ✅ **`listFiles(params)`** - Browse files and directories with filtering
- ✅ **`getFileMetadata(params)`** - Get file information without content
- ✅ **`getFileVersions(params)`** - Access file version history

### Authentication System (Complete)
- ✅ **GitHub OAuth** - User authentication via GitHub
- ✅ **API Key Generation** - Secure API keys with SHA-256 hashing
- ✅ **API Key Management** - Dashboard for creating/deleting keys
- ✅ **Row Level Security** - Database-level access controls
- ✅ **Unified API** - Single Hono-based Edge Function API

### Dashboard & UI (Complete)
- ✅ **Professional Dashboard** - React app with Shadcn UI components
- ✅ **GitHub OAuth Integration** - One-click authentication
- ✅ **API Key Management** - Generate, copy, and delete API keys
- ✅ **Settings Page** - Configure embeddings and project settings
- ✅ **File Browser** - View and manage files (UI ready for file operations)
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Professional Branding** - Logo, styling, and consistent UX

### AI Framework Integration (Complete)
- ✅ **3-Tier SDK Architecture** - Core, Tools, and OpenAI modules for any integration approach
- ✅ **OpenAI Integration** - `@openfiles-ai/sdk/openai` module for seamless AI file operations
- ✅ **Function Calling Tools** - `@openfiles-ai/sdk/tools` module for controlled AI integration
- ✅ **Core API Client** - `@openfiles-ai/sdk/core` module for direct API access
- ✅ **Cross-Agent File Sharing** - Multiple AI agents can collaborate on shared files

### API Endpoints (S3-style)
**Base URL**: `http://127.0.0.1:54321/functions/v1/api` (local) | `https://your-project.supabase.co/functions/v1/api` (hosted)

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/health` | GET | Health check | None |
| `/docs` | GET | API documentation | None |
| `/project` | GET | Get project info | JWT (Bearer token) |
| `/project/apikey/regenerate` | POST | Regenerate API key | JWT (Bearer token) |
| `/files` | GET | List files | API Key |
| `/files` | POST | Write new file | API Key |
| `/files/{path}` | GET | Read file content | API Key |
| `/files/{path}?version=N` | GET | Read specific version | API Key |
| `/files/{path}?metadata` | GET | Get file metadata | API Key |
| `/files/{path}?versions` | GET | List file versions | API Key |
| `/files/edit/{path}` | PUT | Edit file content | API Key |
| `/files/append/{path}` | PUT | Append to file | API Key |
| `/files/overwrite/{path}` | PUT | Overwrite file content | API Key |

**Authentication Methods:**
- **API Key**: Add `x-api-key: oa_your_key_here` header
- **JWT**: Add `Authorization: Bearer your_jwt_token` header

## 🏗️ Architecture

**Current Tech Stack:**
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Frontend**: React + Vite dashboard, Next.js 15 landing page
- **SDK**: TypeScript ESM modules
- **Development**: Turborepo monorepo with pnpm

**Repository Structure:**
```
openfiles-ai/openfiles/
├── sdks/
│   ├── typescript/       # TypeScript SDK (@openfiles-ai/sdk)
│   │   ├── src/          # SDK source code with 3-tier architecture
│   │   ├── dist/         # Built SDK for distribution  
│   │   └── package.json  # NPM package configuration
│   └── python/           # Python SDK (openfiles-ai)
│       ├── openfiles/    # Python package source
│       ├── tests/        # Python test suite
│       └── pyproject.toml # Poetry package configuration
├── .changeset/           # Automated versioning configuration
├── .github/workflows/    # CI/CD automation for publishing
├── package.json          # Root monorepo configuration  
├── turbo.json           # Turborepo build orchestration
└── pnpm-workspace.yaml  # PNPM workspace configuration
```

## 🎯 Use Cases

- **Multi-Agent Development Teams** - AI agents collaborating on shared codebases across sessions
- **AI-to-AI Knowledge Transfer** - Agents building on each other's work seamlessly
- **Code Generation Workflows** - Persistent code projects with version history
- **Documentation Collaboration** - AI agents creating and maintaining shared knowledge bases
- **Content Creation Pipelines** - Multiple AI agents contributing to evolving content
- **Cross-Session Project Building** - Long-term AI development workflows
- **AI Research Collaboration** - Agents sharing findings and building on research

## 💡 Why OpenFiles?

| Traditional Approach | OpenFiles |
|---------------------|---------------|
| 7+ separate tools | Single AI-native platform |
| Weeks of integration | Hours of setup with 3-tier SDK |
| No AI-to-AI collaboration | Seamless cross-agent file sharing |
| Complex vector DB setup | Built-in semantic search foundation |
| Manual file management | Intelligent AI file operations |
| Files disappear between sessions | Persistent across all AI sessions |

## 📈 Development Status

**Current Phase**: Epic 1-6 Complete ✅ | Ready for Polish & Testing Phase 🔄  
**Progress**: 59% complete (145/245 tasks) - MVP foundation ready for production use  
**📊 [Development Progress](project-documents/tracking/progress.md)** - Detailed task tracking

### ✅ Epic 1: Foundation & Infrastructure (Complete)
- ✅ Complete Turborepo monorepo setup with pnpm workspaces
- ✅ Supabase backend with PostgreSQL + pgvector database
- ✅ Complete authentication system (GitHub OAuth + API keys)
- ✅ Database schema with RLS policies and triggers
- ✅ Unified Hono-based Edge Function API
- ✅ Modern development tooling (ESLint, Prettier, Vitest)

### ✅ Epic 2: Multi-Language SDK Development (Complete)
- ✅ **TypeScript SDK** (`@openfiles-ai/sdk`) - All 8 file operations with 3-tier architecture
- ✅ **Python SDK** (`openfiles-ai`) - Complete Python implementation with async support
- ✅ **OpenAI Integration** - Seamless OpenAI SDK integration for both languages
- ✅ **Framework Tools** - Universal AI framework compatibility
- ✅ **Core API Clients** - Direct API access for both languages
- ✅ **Automated Publishing** - Changesets with GitHub Actions for NPM and PyPI
- ✅ **Monorepo Setup** - Turborepo with PNPM workspaces for development
- ✅ OpenAPI specification and auto-generated clients
- ✅ Comprehensive documentation for both SDKs

### 🔄 Epic 3: Semantic Search & AI Features (Coming Soon)
- 🏗️ **Semantic search foundation** - Infrastructure ready, feature implementation in progress
- 🔄 **OpenAI embeddings integration** - Intelligent content discovery by meaning
- 🔄 **pgvector database setup** - Vector search capabilities
- 🔄 **Automatic file content indexing** - Background processing for searchable content
- 🔄 **Real-time AI collaboration** - Live multi-agent file sharing

### ✅ Epic 4: Developer Dashboard (Complete)
- ✅ Professional React dashboard with Shadcn UI
- ✅ GitHub OAuth authentication flow
- ✅ API key management (generate, delete, soft delete)
- ✅ Settings page with embeddings configuration
- ✅ Responsive design with dark/light theme support
- ✅ Professional branding with Logo component
- ✅ Security fixes for RLS policies
- ✅ Toast notifications and comprehensive UX

### ✅ Epic 5: Coming Soon Landing Page (Complete)
- ✅ Professional Next.js 15 landing page with modern design
- ✅ Dark/light theme support with system detection
- ✅ Email collection for early access notifications
- ✅ SEO optimization and performance monitoring
- ✅ Responsive design with smooth animations

### 🔄 Epic 6: Polish & Testing (Ready to Start)
- Performance optimization and reliability improvements
- Comprehensive testing suite (unit, integration, E2E)
- Advanced dashboard features (Monaco Editor, file upload)
- Production readiness and monitoring

### 🔄 Epic 7: Documentation & Launch (Planned)
- Complete documentation website
- Marketing site and launch preparation
- Production deployment and scaling

## 🤝 Contributing

This project is in early development. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🧪 Testing & Development

### Pre-configured Test Data
The project includes pre-seeded test data for immediate development and testing:

```bash
# Test API Key (pre-configured)
test-api-key-12345

# Test User
- Email: test@openfiles.ai
- User ID: 11111111-1111-1111-1111-111111111111
- GitHub: testuser

# Test Project
- Project ID: 22222222-2222-2222-2222-222222222222
- Name: "Test Project"
- Has embeddings enabled

# Sample Files
- /README.md (text/markdown, needs embedding)
- /config.json (application/json, needs embedding)  
- /src/index.js (text/javascript, already processed)
```

### API Testing
```bash
# Test basic API functionality
curl -H "x-api-key: test-api-key-12345" \
  http://127.0.0.1:54321/functions/v1/api/files

# Run comprehensive API tests
./tests/run-api-tests.sh

# Run success case tests (requires environment setup)
export API_KEY="test-api-key-12345"
export CRON_SECRET_KEY="your-cron-secret"
hurl --test --variable api_key=$API_KEY tests/api/04b-internal-success-cases.hurl
```

### SDK Testing
```bash
# Run SDK unit tests (120+ tests passing)
cd packages/sdk-typescript
pnpm test

# Test SDK integration
node -e "
const { OpenFilesClient } = require('./dist/core/index.js');
const client = new OpenFilesClient({
  apiKey: 'oa_test123456789012345678901234567890',
  baseUrl: 'http://127.0.0.1:54321/functions/v1/api'
});
client.listFiles().then(console.log);
"
```

## 🔗 Links

- [OpenFiles Console](https://console.openfiles.ai)
- [Website](https://openfiles.ai)
- [GitHub Repository](https://github.com/openfiles-ai/openfiles)
- [TypeScript SDK Documentation](./sdks/typescript/)
- [Python SDK Documentation](./sdks/python/)

---

**Built for the future of AI development** 🤖✨
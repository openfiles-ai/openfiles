# OpenFiles TypeScript SDK Examples

Complete examples showing three-tier SDK architecture with real-world integration patterns.

## Examples Overview

### 📄 [Document Manager](./document-manager/)

Three integration approaches for the same document management workflow.

**What you'll learn:**
- Core API for maximum control and performance
- Tools integration for custom AI frameworks  
- OpenAI wrapper for natural language interfaces
- When to use each approach

**Run examples:**
```bash
cd typescript-examples/document-manager
pnpm install
pnpm run all
```

### 💬 [AI Chat Application](./ai-chat-app/)

Complete Next.js application using the OpenAI drop-in replacement.

**What you'll see:**
- Zero-configuration AI file operations
- Session isolation and management
- Real-time chat with transparent file operations
- Production-ready application patterns

**Run application:**
```bash
cd typescript-examples/ai-chat-app
pnpm install
pnpm dev  # Visit http://localhost:3002
```

## Quick Start

### Prerequisites

- Node.js 18+
- OpenFiles API running locally or in production
- OpenAI API key (optional, examples work without it)

### Setup All Examples

```bash
# Install dependencies for all examples
pnpm install

# Run document manager examples
pnpm --filter @openfiles/document-manager run all

# Run AI chat application
pnpm --filter @openfiles/ai-chat-app dev
```

### Environment Configuration

Each example has its own `.env.example` file:

```bash
# Required for all examples
OPENFILES_API_KEY=oa_your_api_key_here

# Optional (enables AI features)
OPENAI_API_KEY=sk_your_openai_key_here
```

## SDK Modules Demonstrated

| Module | Import Path | Best For | Example |
|--------|-------------|----------|---------|
| **Core** | `@openfiles-ai/sdk/core` | High-performance, direct control | Document Manager |
| **Tools** | `@openfiles-ai/sdk/tools` | Custom AI frameworks | Document Manager |
| **OpenAI** | `@openfiles-ai/sdk/openai` | AI applications, drop-in replacement | Chat App + Document Manager |

## Key Features Covered

### File Operations (All Examples)
- **Create**: Write new files with content and metadata
- **Read**: Retrieve file content and versions
- **Edit**: String replacement operations
- **Append**: Add content to file end
- **Overwrite**: Replace entire file content
- **List**: Browse and filter files
- **Metadata**: Get file information
- **Versions**: Access file history

### Integration Patterns
- **Session Isolation**: Unique paths prevent conflicts
- **Base Path Organization**: Structured file hierarchies
- **Error Handling**: Comprehensive error management
- **Performance Monitoring**: Timing and operation tracking

### AI Integration
- **Automatic Tool Execution**: Zero configuration file operations
- **Framework Agnostic**: Works with any AI platform
- **Selective Processing**: Handle only OpenFiles operations
- **Natural Language**: Create files through conversation

## What You'll See

Clean, organized output showing successful operations:

```
🔧 OpenFiles Core API Integration
✅ Files created successfully
✅ Core Integration Complete
📊 Operations: 6 created, 2 read, 3 edited, 3 listed
```

## Learning Path

**Recommended order:**

1. **Start with Document Manager** - Learn all three approaches
2. **Compare approaches** - See performance and complexity differences  
3. **Try Chat Application** - Experience full application integration
4. **Apply patterns** - Use learned patterns in your own projects

## Local Development Setup

```bash
# Work with examples
cd typescript-examples/document-manager
pnpm run core-example     # Direct API integration
pnpm run tools-example    # Tools integration  
pnpm run openai-example   # OpenAI wrapper

cd ../ai-chat-app
pnpm dev                  # Full application
```

### Local OpenFiles API (Optional)

For development with local OpenFiles API:

```bash
# In the OpenFiles project root
supabase start
supabase functions serve
```

Then set `OPENFILES_BASE_URL=http://localhost:54321/functions/v1/api` in your `.env` files.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Module not found` | Run `pnpm install` in example directory |
| `Connection refused` | Check API key or network connection |
| `API key errors` | Copy `.env.example` to `.env` and add your keys |
| `🤖 Manual mode` | Add `OPENAI_API_KEY` for AI-powered features |

## Next Steps

1. **Run examples** to see integration patterns in action
2. **Compare approaches** to understand when to use each module
3. **Copy patterns** that fit your specific use case
4. **Build applications** using the demonstrated techniques

---

**Focus:** Clean, practical examples for OpenFiles TypeScript SDK integration
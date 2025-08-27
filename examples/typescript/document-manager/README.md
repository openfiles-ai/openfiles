# OpenFiles TypeScript SDK Examples

Three complete examples showing how to integrate OpenFiles into TypeScript applications using different approaches.

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm package manager
- OpenFiles API access

### Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### Environment Variables

```bash
# Required
OPENFILES_API_KEY=oa_your_api_key_here

# Optional (for OpenAI example)
OPENAI_API_KEY=sk_your_openai_key_here
```

## Run Examples

```bash
# Run individual examples
pnpm run core-example      # Core API integration
pnpm run tools-example     # AI tools integration  
pnpm run openai-example    # OpenAI drop-in replacement

# Run all examples
pnpm run all
```

## Examples Overview

### 1. Core Example (`src/core-example.ts`)

Direct API integration for maximum control and performance.

**What it does:**
- Creates business files (reports, config, data, logs)
- Demonstrates all 8 file operations (write, read, edit, append, overwrite, list, metadata, versions)
- Shows organized file structure with base paths
- Includes error handling and performance monitoring

**Best for:** High-performance apps, direct control, non-AI use cases

### 2. Tools Example (`src/tools-example.ts`)

Framework-agnostic tool definitions for any AI platform.

**What it does:**
- Defines OpenAI-compatible tools for file operations
- Works with any AI framework (OpenAI, Anthropic, Cohere, etc.)
- Demonstrates manual and automatic tool execution
- Shows selective tool processing

**Best for:** Custom AI frameworks, advanced control, multi-AI support

### 3. OpenAI Example (`src/openai-example.ts`)

Drop-in replacement for OpenAI client with automatic file operations.

**What it does:**
- Uses natural language to create files
- Automatically handles tool calling and execution
- Zero configuration file operations
- AI generates business documents, reports, configs

**Best for:** AI applications, chatbots, natural language interfaces

## What You'll See

Each example shows clear progress and operation summaries:

```
🔧 OpenFiles Core API Integration
✅ Files created successfully with organized structure
✅ Data read successfully from organized paths
✅ Core Integration Complete
📊 Operations: 6 created, 2 read, 3 edited, 3 listed
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Module not found` | Run `pnpm install` |
| `❌ Configure API keys in .env` | Add missing API keys to `.env` file |
| `Connection refused` | Check API key or network connection |
| `🤖 Manual mode` | Add `OPENAI_API_KEY` for AI-powered examples |

## Project Structure

```
src/
├── core-example.ts           # Direct API integration
├── tools-example.ts          # AI tools integration
├── openai-example.ts         # OpenAI wrapper integration
└── shared/
    ├── sample-data.ts        # Business sample data
    └── session-utils.ts      # Session isolation utilities
```

## Key Features

- **Session Isolation**: Each test run uses unique paths
- **Business Examples**: Real-world scenarios, not code examples
- **All Operations**: Covers all 8 SDK operations
- **Error Handling**: Comprehensive error management
- **Performance**: Timing and operation counting

## Which Example Should I Use?

| Approach | Best For | Use Cases |
|----------|----------|-----------|
| **Core API** | High-performance apps, direct control | Config management, data storage, monitoring |
| **Tools Integration** | Custom AI frameworks, advanced control | Multi-AI support, batch operations, complex workflows |
| **OpenAI Wrapper** | AI applications, natural language | Chatbots, document generation, content analysis |

## Next Steps

1. Run examples to see integration patterns
2. Copy patterns that fit your use case
3. Check the AI Chat App (`../ai-chat-app/`) for a complete application
4. Integrate into your TypeScript project using the shown patterns

---

**Focus:** Clean integration examples for OpenFiles TypeScript SDK
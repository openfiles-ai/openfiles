# OpenFiles Python SDK Examples

Three complete examples showing how to integrate OpenFiles into Python applications using different approaches.

## Quick Start

### Prerequisites

- Python 3.9+
- Poetry package manager
- OpenFiles API access

### Setup

```bash
# Install dependencies
poetry install

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
python src/core_example.py      # Core API integration
python src/tools_example.py     # AI tools integration
python src/openai_example.py    # OpenAI drop-in replacement

# Or use Poetry scripts (if defined)
poetry run core-example
poetry run tools-example
poetry run openai-example
```

## Examples Overview

### 1. Core Example (`src/core_example.py`)

Direct API integration for maximum control and performance.

**What it does:**
- Creates business files (reports, config, data, logs)
- Demonstrates all 8 file operations (write, read, edit, append, overwrite, list, metadata, versions)
- Shows organized file structure with base paths
- Includes error handling and performance monitoring

**Best for:** High-performance apps, direct control, non-AI use cases

### 2. Tools Example (`src/tools_example.py`)

Framework-agnostic tool definitions for any AI platform.

**What it does:**
- Defines OpenAI-compatible tools for file operations
- Works with any AI framework (OpenAI, Anthropic, Cohere, etc.)
- Demonstrates manual and automatic tool execution
- Shows selective tool processing

**Best for:** Custom AI frameworks, advanced control, multi-AI support

### 3. OpenAI Example (`src/openai_example.py`)

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
| `ModuleNotFoundError: openfiles` | Run `poetry install` |
| `❌ Configure API keys in .env` | Add missing API keys to `.env` file |
| `Connection refused` | Check API key or network connection |
| `🤖 Manual mode` | Add `OPENAI_API_KEY` for AI-powered examples |

## Project Structure

```
src/
├── core_example.py           # Direct API integration
├── tools_example.py          # AI tools integration
├── openai_example.py         # OpenAI wrapper integration
└── shared/
    ├── sample_data.py        # Business sample data
    └── session_utils.py      # Session isolation utilities
```

## Key Features

- **Session Isolation**: Each test run uses unique paths
- **Business Examples**: Real-world scenarios, not code examples
- **All Operations**: Covers all 8 SDK operations
- **Error Handling**: Comprehensive error management
- **Performance**: Timing and operation counting

## Next Steps

1. Run examples to see integration patterns
2. Copy patterns that fit your use case
3. Check the main SDK documentation for detailed API reference
4. Integrate into your Python project using the shown patterns

---

**Focus:** Clean integration examples for OpenFiles Python SDK
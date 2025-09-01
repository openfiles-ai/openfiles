# OpenFiles AI Chat Application

Complete Next.js chat application demonstrating the `@openfiles/sdk/openai` drop-in replacement module.

## Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API key
- OpenFiles API access

### Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Start the application
pnpm dev
```

Visit [http://localhost:3002](http://localhost:3002) to use the chat app.

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk_your_openai_api_key_here
OPENFILES_API_KEY=oa_your_api_key_here

# Optional
NODE_ENV=development
```

## Local Development (Optional)

For local testing with development OpenFiles API:

```bash
# In the OpenFiles project root
supabase start
supabase functions serve
```

Then set `OPENFILES_BASE_URL=http://localhost:54321/functions/v1/api` in your `.env.local`.

## Features

### Core Features
- **Multi-Session Chat**: Create and manage multiple chat sessions
- **AI File Operations**: AI automatically handles file operations through natural language
- **Persistent Storage**: Sessions saved as JSON files with automatic backup
- **Real-time Chat**: Smooth experience with loading states and auto-scroll

### AI Integration
- **Drop-in Replacement**: Uses `@openfiles/sdk/openai` instead of standard OpenAI
- **Automatic Tool Execution**: Zero configuration file operations
- **Session Isolation**: Each chat session has its own file workspace
- **Transparent Operations**: See AI tool usage with collapsible details

### UI/UX
- **Modern Interface**: Built with Shadcn UI and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Mode**: Theme support throughout the app
- **Conversation History**: Full context maintained for better responses

## Usage Examples

### File Operations Through Chat

**Create files:**
```
User: "Create a React component for a todo list"
AI: Creates TodoList.jsx and explains the component structure
```

**Read and modify:**
```
User: "Show me the todo component and add TypeScript types"
AI: Reads the file and creates an improved TypeScript version
```

**Search and organize:**
```
User: "Search for files related to authentication and organize them"
AI: Uses semantic search and creates organized file structure
```

**Business documents:**
```
User: "Create a project README with installation instructions"
AI: Generates comprehensive README.md with proper structure
```

## How It Works

### Chat Flow
1. User sends message to `/api/chat`
2. API creates session-specific OpenAI client
3. OpenAI processes message with file tools available
4. AI automatically executes file operations as needed
5. Response shown to user with file operation details
6. Session updated with full conversation history

### Session Management
- **Unique Isolation**: Each session operates in isolated file workspace
- **Automatic Saving**: Sessions saved to `data/sessions/` as JSON
- **Session Recovery**: Previous conversations fully restored
- **File Workspaces**: Session-specific paths prevent conflicts

### File Organization
```
Session: abc123
├── documents/           # User documents
├── projects/           # Project files  
├── configs/            # Configuration files
└── temp/              # Temporary files
```

## Project Structure

```
app/
├── api/
│   ├── chat/route.ts            # Main chat endpoint
│   └── sessions/
│       ├── route.ts             # List sessions
│       └── [id]/route.ts        # Session management
├── layout.tsx                   # Root layout
└── page.tsx                     # Main chat page

components/
├── ui/                          # Shadcn UI components
├── ChatInterface.tsx            # Main chat interface
├── MessageBubble.tsx            # Message display
└── SessionSidebar.tsx           # Session management

lib/
├── openai.ts                    # OpenAI configuration
├── sessions.ts                  # Session file operations
└── utils.ts                     # Utilities

types/
└── chat.ts                      # TypeScript interfaces
```

## Key Features Demonstrated

### Drop-in OpenAI Replacement
- Change only the import: `from '@openfiles/sdk/openai'`
- All existing OpenAI code works unchanged
- Automatic file tool injection and execution
- Zero configuration required

### Session Isolation
- Each chat creates unique workspace
- Prevents file conflicts between sessions
- Organized file structure per session
- Automatic cleanup on session deletion

### Real-world Integration
- Complete application, not just examples
- Production-ready error handling
- Clean state management
- Professional UI/UX

## Available Scripts

```bash
pnpm dev          # Start development server (port 3002)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # TypeScript validation
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Module not found` | Run `pnpm install` |
| `API key errors` | Check `.env.local` configuration |
| `Connection refused` | Check API key or network connection |
| `Session loading fails` | Check file permissions in `data/sessions/` |
| `Build errors` | Run `pnpm install` and check TypeScript errors |

### Debug Mode

Set `NODE_ENV=development` to see detailed logs in browser console.

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **AI Integration**: OpenAI API with OpenFiles SDK
- **UI Components**: Shadcn UI with Radix primitives
- **Styling**: Tailwind CSS
- **File Storage**: OpenFiles platform
- **Session Storage**: JSON files with backup
- **Type Safety**: Full TypeScript integration

## Customization

### Adding New Features
1. **New UI Components**: Use Shadcn components for consistency
2. **API Routes**: Follow RESTful patterns in `app/api/`
3. **Session Schema**: Extend types in `types/chat.ts`

### Configuration Options
```typescript
// lib/openai.ts
const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  openFilesApiKey: process.env.OPENFILES_API_KEY!,
  basePath: `chat-sessions/${sessionId}`,  // Session isolation
  // Add callbacks for monitoring
  onFileOperation: (op) => console.log('File op:', op),
  onError: (error) => console.error('Error:', error)
})
```

## Next Steps

1. **Explore the App**: Try different file operations through chat
2. **Check Integration**: See how easy the OpenAI replacement is
3. **Copy Patterns**: Use session isolation and UI patterns in your apps
4. **Extend Features**: Add authentication, database storage, or new AI capabilities

---

**Focus:** Complete AI chat application with OpenFiles integration
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import type { ChatRequest, ChatResponse } from '@/types/chat'
import { createChatCompletion, createSessionAI } from '@/lib/openai'
import { getSession, addMessageToSession } from '@/lib/sessions'

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { sessionId, message } = body

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      )
    }

    // Get current session
    const session = await getSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Create user message
    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: message,
      timestamp: new Date(),
    }

    // Add user message to session
    let updatedSession = await addMessageToSession(sessionId, userMessage)
    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      )
    }

    // Prepare messages for OpenAI (include full conversation history)
    const messages = updatedSession.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    // Add system message at the beginning
    const systemMessage = {
      role: 'system' as const,
      content: `You are a helpful AI assistant with file operation capabilities.

FILE OPERATION SELECTION GUIDE:
- **write_file**: CREATE NEW files only (fails if file exists). Use when user wants to create/generate/make a new file.
- **read_file**: READ and DISPLAY existing file content. Use when user asks to see/show/view/read existing files.
- **edit_file**: MODIFY parts of existing files by replacing specific text.
- **append_to_file**: ADD content to the END of existing files.
- **overwrite_file**: REPLACE ALL content in existing files.
- **list_files**: BROWSE available files in directories.

IMPORTANT RULES:
- write_file is ONLY for NEW files - it will fail if the file already exists
- When user asks to "show me" or "what did you write" after creating a file → use read_file
- When user references "the file" or "it" after creation → use read_file to show content
- For existing files, NEVER use write_file - use edit_file, append_to_file, or overwrite_file
- Always show actual content when reading files

You have persistent file storage. Files you create remain available for reading and editing.`,
    }

    const messagesWithSystem = [systemMessage, ...messages]

    // Create session-specific AI client for isolated file storage
    const sessionAI = createSessionAI(sessionId)
    
    // Get AI response with session-specific file operations
    const aiResponse = await createChatCompletion({
      messages: messagesWithSystem,
      sessionClient: sessionAI,
    })

    // Create assistant message
    const assistantMessage = {
      id: uuidv4(),
      role: 'assistant' as const,
      content: aiResponse.message.content,
      timestamp: new Date(),
    }

    // Add assistant message to session
    updatedSession = await addMessageToSession(sessionId, assistantMessage)
    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Failed to update session with AI response' },
        { status: 500 }
      )
    }

    const response: ChatResponse = {
      message: assistantMessage,
      session: updatedSession,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './MessageBubble'
import { SessionSidebar } from './SessionSidebar'
import type { ChatSession, ChatRequest, ChatResponse, SessionListResponse, CreateSessionResponse } from '@/types/chat'

export function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [currentSession?.messages])

  const loadSessions = async () => {
    setIsLoadingSessions(true)
    try {
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const data: SessionListResponse = await response.json()
        setSessions(data.sessions.map(s => ({ 
          ...s, 
          messages: [],
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt)
        })))
        
        // Auto-select first session if available
        if (data.sessions.length > 0 && !currentSession) {
          loadSession(data.sessions[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`)
      if (response.ok) {
        const session: ChatSession = await response.json()
        // Convert date strings back to Date objects
        session.createdAt = new Date(session.createdAt)
        session.updatedAt = new Date(session.updatedAt)
        session.messages = session.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        setCurrentSession(session)
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  const createNewSession = async (name?: string) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      
      if (response.ok) {
        const data: CreateSessionResponse = await response.json()
        const newSession = {
          ...data.session,
          createdAt: new Date(data.session.createdAt),
          updatedAt: new Date(data.session.updatedAt),
        }
        
        setSessions(prev => [newSession, ...prev])
        setCurrentSession(newSession)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        if (currentSession?.id === sessionId) {
          setCurrentSession(null)
          // Load first available session or create new one
          const remainingSessions = sessions.filter(s => s.id !== sessionId)
          if (remainingSessions.length > 0) {
            loadSession(remainingSessions[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || !currentSession || isLoading) return

    const trimmedMessage = message.trim()
    setMessage('')
    setIsLoading(true)

    try {
      const request: ChatRequest = {
        sessionId: currentSession.id,
        message: trimmedMessage,
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (response.ok) {
        const data: ChatResponse = await response.json()
        const updatedSession = {
          ...data.session,
          createdAt: new Date(data.session.createdAt),
          updatedAt: new Date(data.session.updatedAt),
          messages: data.session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }
        
        setCurrentSession(updatedSession)
        
        // Update sessions list
        setSessions(prev => prev.map(s => 
          s.id === updatedSession.id 
            ? { ...s, updatedAt: updatedSession.updatedAt }
            : s
        ))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (isLoadingSessions) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r">
        <SessionSidebar
          sessions={sessions}
          currentSessionId={currentSession?.id || null}
          onSessionSelect={loadSession}
          onNewSession={createNewSession}
          onDeleteSession={deleteSession}
          className="border-0 h-full"
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Header */}
            <div className="border-b p-4">
              <h1 className="text-xl font-semibold">{currentSession.name}</h1>
              <p className="text-sm text-muted-foreground">
                Created {new Date(currentSession.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea ref={scrollAreaRef} className="h-full p-4">
                {currentSession.messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Welcome to AI Chat</h3>
                      <p className="text-muted-foreground">
                        This AI assistant can help you with various tasks and have natural conversations.
                        <br />
                        Try asking questions, requesting help with coding, or just having a chat!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentSession.messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                  className="min-h-[60px] max-h-[200px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim() || isLoading}
                  size="lg"
                  className="px-6"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">No Session Selected</h2>
              <p className="text-muted-foreground">
                Create a new chat session or select an existing one to get started.
              </p>
              <Button onClick={() => createNewSession()}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Session
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
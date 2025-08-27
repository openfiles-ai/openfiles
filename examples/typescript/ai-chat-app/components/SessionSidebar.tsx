'use client'

import { useState } from 'react'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ChatSession } from '@/types/chat'

interface SessionSidebarProps {
  sessions: Pick<ChatSession, 'id' | 'name' | 'createdAt' | 'updatedAt'>[]
  currentSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onNewSession: (name?: string) => void
  onDeleteSession: (sessionId: string) => void
  className?: string
}

export function SessionSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  className,
}: SessionSidebarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')

  const handleCreateSession = () => {
    if (isCreating) {
      const name = newSessionName.trim() || undefined
      onNewSession(name)
      setNewSessionName('')
      setIsCreating(false)
    } else {
      setIsCreating(true)
    }
  }

  const handleCancelCreate = () => {
    setIsCreating(false)
    setNewSessionName('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSession()
    } else if (e.key === 'Escape') {
      handleCancelCreate()
    }
  }

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Chat Sessions</h2>
          {!isCreating && (
            <Button
              size="sm"
              onClick={handleCreateSession}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {isCreating && (
          <div className="space-y-2">
            <Input
              placeholder="Session name (optional)"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
              className="text-sm"
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleCreateSession}>
                Create
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelCreate}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No chat sessions yet.
              <br />
              Create your first session to get started.
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group relative rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
                  currentSessionId === session.id && "bg-accent border-accent-foreground/20"
                )}
                onClick={() => onSessionSelect(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">
                        {session.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
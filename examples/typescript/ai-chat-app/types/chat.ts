export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface ChatSession {
  id: string
  name: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatRequest {
  sessionId: string
  message: string
}

export interface ChatResponse {
  message: Message
  session: ChatSession
}

export interface SessionListResponse {
  sessions: Pick<ChatSession, 'id' | 'name' | 'createdAt' | 'updatedAt'>[]
}

export interface CreateSessionRequest {
  name?: string
}

export interface CreateSessionResponse {
  session: ChatSession
}
import { NextRequest, NextResponse } from 'next/server'
import type { SessionListResponse, CreateSessionRequest, CreateSessionResponse } from '@/types/chat'
import { getAllSessions, createSession } from '@/lib/sessions'

export async function GET() {
  try {
    const sessions = await getAllSessions()
    
    const response: SessionListResponse = {
      sessions,
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Sessions GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSessionRequest = await request.json()
    const { name } = body
    
    const session = await createSession(name)
    
    const response: CreateSessionResponse = {
      session,
    }
    
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Sessions POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession, deleteSession } from '@/lib/sessions'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession(id)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(session)
  } catch (error) {
    console.error('Session GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    
    const updatedSession = await updateSession(id, { name })
    
    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Session PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const success = await deleteSession(id)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Session not found or could not be deleted' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Session DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
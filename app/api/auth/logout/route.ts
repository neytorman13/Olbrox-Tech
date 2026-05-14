export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { clearSessionCookie, SESSION_COOKIE } from '@/lib/auth'

async function handleLogout(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    if (token) {
      await query('DELETE FROM sessions WHERE token = ?', [token])
    }

    const response = NextResponse.json({ success: true })
    clearSessionCookie(response)
    return response
  } catch (error) {
    console.error('Auth logout error:', error)
    const response = NextResponse.json({ error: 'Logout failed' }, { status: 500 })
    clearSessionCookie(response)
    return response
  }
}

export async function POST(request: NextRequest) {
  return handleLogout(request)
}

export async function GET(request: NextRequest) {
  return handleLogout(request)
}



export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { querySingle, query } from '@/lib/db'
import { hashPassword, createSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      )
    }

    let user = await querySingle<{
      id: string
      email: string
      full_name: string | null
      avatar_url: string | null
      role: string | null
      password_hash: string | null
      raw_user_meta_data: string | null
    }>(
      `SELECT id, email, full_name, avatar_url, role, password_hash, raw_user_meta_data FROM users WHERE email = ? LIMIT 1`,
      [email],
    )

    if (!user) {
      const fallbackEmail = email.endsWith('@olbrox.tech')
        ? email.replace('@olbrox.tech', '@olbroxtech.com')
        : email.endsWith('@olbroxtech.com')
        ? email.replace('@olbroxtech.com', '@olbrox.tech')
        : ''

      if (fallbackEmail) {
        user = await querySingle<{
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string | null
          password_hash: string | null
          raw_user_meta_data: string | null
        }>(
          `SELECT id, email, full_name, avatar_url, role, password_hash, raw_user_meta_data FROM users WHERE email = ? LIMIT 1`,
          [fallbackEmail],
        )
      }
    }

    if (!user || !user.password_hash || !hashPassword(password) || hashPassword(password) !== user.password_hash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      )
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ')

    await query(
      `INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`,
      [crypto.randomUUID(), user.id, token, expiresAt],
    )

    const response = NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name ?? undefined,
          avatar_url: user.avatar_url ?? undefined,
          role: user.role ?? undefined,
          user_metadata: user.raw_user_meta_data
            ? JSON.parse(user.raw_user_meta_data)
            : { full_name: user.full_name },
        },
        session: {
          token,
        },
      },
      error: null,
    })

    createSessionCookie(response, token)
    return response
  } catch (error) {
    console.error('Auth login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 },
    )
  }
}



import { cookies } from 'next/headers'
import { type NextRequest, type NextResponse } from 'next/server'
import crypto from 'crypto'
import { query, querySingle } from '@/lib/db'

export const SESSION_COOKIE = 'OLBROX_SESSION'
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60

export function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function verifyPassword(password: string, hash: string) {
  return hashPassword(password) === hash
}

export function createSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
  })
}

export async function getSessionTokenFromRequest(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value ?? null
}

export async function getSessionTokenFromCookies() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value ?? null
}

export async function getAuthUserFromToken(token: string | null) {
  if (!token) {
    return null
  }

  const session = await querySingle<{
    user_id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    role: string | null
    raw_user_meta_data: string | null
    expires_at: string
  }>(
    `SELECT
      s.user_id,
      u.email,
      u.full_name,
      u.avatar_url,
      u.role,
      u.raw_user_meta_data,
      s.expires_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
      AND s.expires_at > CURRENT_TIMESTAMP`,
    [token],
  )

  if (!session) {
    return null
  }

  let userMetadata = undefined
  if (session.raw_user_meta_data) {
    try {
      userMetadata = JSON.parse(session.raw_user_meta_data)
    } catch {
      userMetadata = { full_name: session.full_name }
    }
  } else {
    userMetadata = { full_name: session.full_name }
  }

  return {
    id: session.user_id,
    email: session.email,
    full_name: session.full_name ?? undefined,
    avatar_url: session.avatar_url ?? undefined,
    role: session.role ?? undefined,
    user_metadata: userMetadata,
  }
}

export async function getAuthUserFromRequest(request: NextRequest) {
  const token = await getSessionTokenFromRequest(request)
  return getAuthUserFromToken(token)
}

export async function getAuthUser() {
  const token = await getSessionTokenFromCookies()
  return getAuthUserFromToken(token)
}


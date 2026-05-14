import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'OLBROX_SESSION'

export async function updateSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? null

  if (request.nextUrl.pathname.startsWith('/admin') && !token) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}


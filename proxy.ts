import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'OLBROX_SESSION'

export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? null

  if (request.nextUrl.pathname.startsWith('/admin') && !token) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

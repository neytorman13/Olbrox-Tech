export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    return NextResponse.json({ data: { user }, error: null })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ data: { user: null }, error: 'Unable to fetch user' }, { status: 500 })
  }
}



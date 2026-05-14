export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest, hashPassword } from '@/lib/auth'
import { query, querySingle } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates: string[] = []
    const values: unknown[] = []

    if (body.data?.full_name) {
      updates.push('full_name = ?')
      updates.push('raw_user_meta_data = ?')
      values.push(body.data.full_name)
      values.push(JSON.stringify({ full_name: body.data.full_name }))
    }

    if (body.password) {
      updates.push('password_hash = ?')
      values.push(hashPassword(body.password))
    }

    if (updates.length === 0) {
      return NextResponse.json({ data: { user }, error: null })
    }

    values.push(user.id)
    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values,
    )

    const updatedUser = await querySingle<{
      id: string
      email: string
      full_name: string | null
      avatar_url: string | null
      role: string | null
      raw_user_meta_data: string | null
    }>(
      `SELECT id, email, full_name, avatar_url, role, raw_user_meta_data FROM users WHERE id = ? LIMIT 1`,
      [user.id],
    )

    if (!updatedUser) {
      return NextResponse.json({ error: 'Unable to update user' }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          full_name: updatedUser.full_name ?? undefined,
          avatar_url: updatedUser.avatar_url ?? undefined,
          role: updatedUser.role ?? undefined,
          user_metadata: updatedUser.raw_user_meta_data
            ? JSON.parse(updatedUser.raw_user_meta_data)
            : { full_name: updatedUser.full_name },
        },
      },
      error: null,
    })
  } catch (error) {
    console.error('Auth update error:', error)
    return NextResponse.json({ error: 'Unable to update user' }, { status: 500 })
  }
}



export const runtime = 'nodejs'

import { del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { query, querySingle } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const media = await querySingle<{
      id: string
      file_url: string
    }>('SELECT id, file_url FROM media WHERE id = ? LIMIT 1', [id])

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    try {
      await del(media.file_url)
    } catch (blobError) {
      console.error('Blob delete error:', blobError)
    }

    await query('DELETE FROM media WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { alt_text, caption, folder } = body

    await query(
      `UPDATE media SET alt_text = ?, caption = ?, folder = ? WHERE id = ?`,
      [alt_text || null, caption || null, folder || null, id],
    )

    const media = await querySingle<{
      id: string
      filename: string
      original_filename: string
      file_path: string
      file_url: string
      file_type: string
      mime_type: string
      file_size: number
      alt_text: string | null
      caption: string | null
      folder: string
      uploaded_by: string
      created_at: string
    }>('SELECT * FROM media WHERE id = ? LIMIT 1', [id])

    return NextResponse.json({ success: true, media })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}



export const runtime = 'nodejs'

import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'general'
    const altText = (formData.get('alt_text') as string) || ''
    const caption = (formData.get('caption') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'bin'
    const filename = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

    const blob = await put(filename, file, {
      access: 'public',
    })

    let fileType = 'document'
    if (file.type.startsWith('image/')) {
      fileType = 'image'
    } else if (file.type === 'application/pdf') {
      fileType = 'pdf'
    }

    const sql = `INSERT INTO media (
      id,
      filename,
      original_filename,
      file_path,
      file_url,
      file_type,
      mime_type,
      file_size,
      alt_text,
      caption,
      folder,
      uploaded_by,
      created_at
    ) VALUES (
      UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
    )`

    await query(sql, [
      filename,
      file.name,
      blob.pathname,
      blob.url,
      fileType,
      file.type,
      file.size,
      altText || null,
      caption || null,
      folder,
      user.id,
    ])

    return NextResponse.json({ success: true, url: blob.url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}



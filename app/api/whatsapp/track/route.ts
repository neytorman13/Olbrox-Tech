export const runtime = 'nodejs'

import { type NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      phone_number,
      contact_name,
      initial_message,
      source_page,
      source_button,
      utm_source,
      utm_medium,
      utm_campaign,
    } = body

    if (!phone_number) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    const userAgent = request.headers.get('user-agent') || ''
    const referrer = request.headers.get('referer') || ''

    const sql = `INSERT INTO whatsapp_conversations (
      id,
      phone_number,
      contact_name,
      initial_message,
      source_page,
      source_button,
      utm_source,
      utm_medium,
      utm_campaign,
      referrer,
      user_agent,
      status,
      created_at,
      updated_at
    ) VALUES (
      UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'initiated', NOW(), NOW()
    )`

    await query(sql, [
      phone_number,
      contact_name || null,
      initial_message || null,
      source_page || null,
      source_button || null,
      utm_source || null,
      utm_medium || null,
      utm_campaign || null,
      referrer || null,
      userAgent.substring(0, 500),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('WhatsApp tracking error:', error)
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
  }
}



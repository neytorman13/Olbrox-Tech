export const runtime = 'nodejs'

import { type NextRequest, NextResponse } from 'next/server'
import { query, querySingle } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      full_name,
      email,
      phone,
      company,
      message,
      source = 'website',
    } = body

    if (!full_name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 },
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      )
    }

    const leadId = crypto.randomUUID()
    const insertLeadSql = `INSERT INTO leads (
      id,
      full_name,
      email,
      phone,
      company,
      message,
      source,
      status
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, 'new'
    )`

    await query(insertLeadSql, [
      leadId,
      full_name,
      email,
      phone || null,
      company || null,
      message || null,
      source,
    ])

    try {
      const admin = await querySingle<{ id: string }>(
        'SELECT id FROM admin_profiles LIMIT 1',
      )

      if (admin?.id) {
        const notificationSql = `INSERT INTO notifications (
          id,
          user_id,
          title,
          message,
          type,
          action_url
        ) VALUES (
          UUID(), ?, ?, ?, 'info', ?
        )`

        await query(notificationSql, [
          admin.id,
          'Nuevo Lead',
          `${full_name} ha enviado un mensaje de contacto`,
          `/admin/leads?id=${leadId}`,
        ])
      }
    } catch (notifError) {
      console.error('Notification error:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Submission failed' },
      { status: 500 },
    )
  }
}



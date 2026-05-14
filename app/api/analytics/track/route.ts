export const runtime = 'nodejs'

import { type NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      page_path,
      session_id,
      visit_duration = 0,
    } = body

    if (!page_path) {
      return NextResponse.json({ error: 'Page path required' }, { status: 400 })
    }

    const userAgent = request.headers.get('user-agent') || ''
    const forwardedFor = request.headers.get('x-forwarded-for')
    const visitorIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
    const referer = request.headers.get('referer') || ''

    const deviceType = getDeviceType(userAgent)
    const browser = getBrowser(userAgent)
    const os = getOS(userAgent)

    const sql = `INSERT INTO page_analytics (
      id,
      page_path,
      visitor_ip,
      user_agent,
      referrer,
      device_type,
      browser,
      os,
      session_id,
      visit_duration
    ) VALUES (
      UUID(),
      ?, ?, ?, ?, ?, ?, ?, ?, ?
    )`

    await query(sql, [
      page_path,
      visitorIp,
      userAgent.substring(0, 500),
      referer.substring(0, 500),
      deviceType,
      browser,
      os,
      session_id || null,
      visit_duration,
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
  }
}

function getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  const ua = userAgent.toLowerCase()
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

function getBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  if (ua.includes('firefox')) return 'Firefox'
  if (ua.includes('edg')) return 'Edge'
  if (ua.includes('chrome')) return 'Chrome'
  if (ua.includes('safari')) return 'Safari'
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera'
  return 'Other'
}

function getOS(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('mac os') || ua.includes('macos')) return 'macOS'
  if (ua.includes('linux')) return 'Linux'
  if (ua.includes('android')) return 'Android'
  if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS'
  return 'Other'
}



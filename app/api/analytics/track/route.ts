export const runtime = 'nodejs'

import { type NextRequest, NextResponse } from 'next/server'
import { query, querySingle } from '@/lib/db'
import {
  ensureAnalyticsSchema,
  getBrowser,
  getClientIp,
  getDeviceType,
  getGeoFromHeaders,
  getOS,
  getTrafficSource,
} from '@/lib/analytics-server'

export async function POST(request: NextRequest) {
  try {
    await ensureAnalyticsSchema()

    const body = await request.json()
    const {
      event_id,
      page_path,
      session_id,
      visit_duration = 0,
      referrer: bodyReferrer,
      utm_source,
      utm_medium,
      utm_campaign,
    } = body

    if (!page_path) {
      return NextResponse.json({ error: 'Page path required' }, { status: 400 })
    }

    const userAgent = request.headers.get('user-agent') || ''
    const visitorIp = getClientIp(request.headers)
    const referer = bodyReferrer || request.headers.get('referer') || ''
    const geo = getGeoFromHeaders(request.headers)

    const deviceType = getDeviceType(userAgent)
    const browser = getBrowser(userAgent)
    const os = getOS(userAgent)
    const trafficSource = getTrafficSource(referer, utm_source)
    const eventId = typeof event_id === 'string' && event_id.trim() ? event_id.trim() : crypto.randomUUID()
    const normalizedDuration = Math.max(0, Math.round(Number(visit_duration) || 0))

    const existingRecord = await querySingle<{
      id: string
      visit_duration: number | null
      session_id: string | null
      visitor_ip: string | null
      referrer: string | null
      country: string | null
      country_code: string | null
      region: string | null
      city: string | null
      traffic_source: string | null
      utm_source: string | null
      utm_medium: string | null
      utm_campaign: string | null
    }>(
      `
        SELECT
          id,
          visit_duration,
          session_id,
          visitor_ip,
          referrer,
          country,
          country_code,
          region,
          city,
          traffic_source,
          utm_source,
          utm_medium,
          utm_campaign
        FROM page_analytics
        WHERE id = ?
        LIMIT 1
      `,
      [eventId],
    )

    if (existingRecord) {
      await query(
        `
          UPDATE page_analytics
          SET
            visit_duration = ?,
            session_id = ?,
            visitor_ip = ?,
            user_agent = ?,
            referrer = ?,
            country = ?,
            country_code = ?,
            region = ?,
            city = ?,
            device_type = ?,
            browser = ?,
            os = ?,
            traffic_source = ?,
            utm_source = ?,
            utm_medium = ?,
            utm_campaign = ?
          WHERE id = ?
        `,
        [
          Math.max(Number(existingRecord.visit_duration || 0), normalizedDuration),
          session_id || existingRecord.session_id,
          visitorIp || existingRecord.visitor_ip,
          userAgent.substring(0, 500),
          referer.substring(0, 500) || existingRecord.referrer,
          geo.country || existingRecord.country,
          geo.countryCode || existingRecord.country_code,
          geo.region || existingRecord.region,
          geo.city || existingRecord.city,
          deviceType,
          browser,
          os,
          trafficSource || existingRecord.traffic_source,
          utm_source || existingRecord.utm_source,
          utm_medium || existingRecord.utm_medium,
          utm_campaign || existingRecord.utm_campaign,
          eventId,
        ],
      )

      return NextResponse.json({ success: true, id: eventId, updated: true })
    }

    const sql = `INSERT INTO page_analytics (
      id,
      page_path,
      visitor_ip,
      referrer,
      country,
      country_code,
      region,
      city,
      device_type,
      browser,
      os,
      session_id,
      visit_duration,
      traffic_source,
      utm_source,
      utm_medium,
      utm_campaign,
      user_agent
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )`

    await query(sql, [
      eventId,
      page_path,
      visitorIp || 'unknown',
      referer.substring(0, 500),
      geo.country,
      geo.countryCode,
      geo.region,
      geo.city,
      deviceType,
      browser,
      os,
      session_id || null,
      normalizedDuration,
      trafficSource,
      utm_source || null,
      utm_medium || null,
      utm_campaign || null,
      userAgent.substring(0, 500),
    ])

    return NextResponse.json({ success: true, id: eventId, updated: false })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
  }
}



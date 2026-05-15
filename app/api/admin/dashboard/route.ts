export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { ensureAnalyticsSchema } from "@/lib/analytics-server"

type CountRow = { total: number }
type TotalsRow = { total: number; published?: number; featured?: number }
type TrendRow = { day: string; value: number }
type DeviceRow = { label: string | null; total: number }
type CountryRow = { country: string | null; total: number }
type SourceRow = { source: string | null; total: number }
type TopPageRow = {
  page_path: string | null
  pageviews: number
  sessions: number
  avg_duration: number
}
type HealthRow = { block_identifier: string; is_published: number }
type UpdateRow = { id: string; title: string; type: string; updated_at: string }
type StatusRow = { status: string | null; total: number; amount?: number | string | null }
type SessionSummaryRow = {
  total_sessions: number
  engaged_sessions: number
  avg_duration: number
  views_per_session: number
}

function toNumber(value: unknown) {
  return Number(value || 0)
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function fillDailySeries(rows: TrendRow[], days: number) {
  const mapped = new Map(rows.map((row) => [row.day, toNumber(row.value)]))
  const today = new Date()

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - 1 - index))
    const key = dayKey(date)

    return {
      day: key,
      value: mapped.get(key) || 0,
    }
  })
}

function formatSource(source: string | null) {
  return source?.trim() ? source : "direct"
}

async function getSessionSummary() {
  const rows = await query<SessionSummaryRow[]>(
    `
      SELECT
        COUNT(*) AS total_sessions,
        SUM(CASE WHEN pageviews >= 2 OR duration_seconds > 10 THEN 1 ELSE 0 END) AS engaged_sessions,
        COALESCE(AVG(duration_seconds), 0) AS avg_duration,
        COALESCE(AVG(pageviews), 0) AS views_per_session
      FROM (
        SELECT
          COALESCE(NULLIF(session_id, ''), CONCAT(IFNULL(visitor_ip, ''), '#', DATE(created_at))) AS session_key,
          COUNT(*) AS pageviews,
          MAX(COALESCE(visit_duration, 0)) AS duration_seconds
        FROM page_analytics
        GROUP BY COALESCE(NULLIF(session_id, ''), CONCAT(IFNULL(visitor_ip, ''), '#', DATE(created_at)))
      ) session_rollup
    `,
  )

  return rows[0] || {
    total_sessions: 0,
    engaged_sessions: 0,
    avg_duration: 0,
    views_per_session: 0,
  }
}

export async function GET() {
  try {
    await ensureAnalyticsSchema()

    const [
      sessionSummary,
      totalPageviewsRows,
      currentVisitorsRows,
      pageviewTrendRows,
      sessionTrendRows,
      topPagesRows,
      deviceRows,
      countryRows,
      sourceRows,
      contentRows,
      serviceRows,
      projectRows,
      faqRows,
      mediaRows,
      healthRows,
      recentUpdates,
      currentPageviews14Rows,
      previousPageviews14Rows,
      visits30Rows,
      leads30Rows,
      leadStatusRows,
      forms30Rows,
      unhandledFormsRows,
      whatsapp30Rows,
      whatsappOpenRows,
      whatsappStatusRows,
      quotesStatusRows,
      acceptedRevenueRows,
      followupsPendingRows,
      followupsOverdueRows,
      meetingsTodayRows,
      meetingsUpcomingRows,
    ] = await Promise.all([
      getSessionSummary(),
      query<CountRow[]>("SELECT COUNT(*) AS total FROM page_analytics"),
      query<CountRow[]>(
        `
          SELECT COUNT(DISTINCT COALESCE(NULLIF(session_id, ''), CONCAT(IFNULL(visitor_ip, ''), '#', DATE(created_at)))) AS total
          FROM page_analytics
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        `,
      ),
      query<TrendRow[]>(
        `
          SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS value
          FROM page_analytics
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
          GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
          ORDER BY day ASC
        `,
      ),
      query<TrendRow[]>(
        `
          SELECT day, COUNT(*) AS value
          FROM (
            SELECT
              DATE_FORMAT(MIN(created_at), '%Y-%m-%d') AS day,
              COALESCE(NULLIF(session_id, ''), CONCAT(IFNULL(visitor_ip, ''), '#', DATE(created_at))) AS session_key
            FROM page_analytics
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
            GROUP BY COALESCE(NULLIF(session_id, ''), CONCAT(IFNULL(visitor_ip, ''), '#', DATE(created_at)))
          ) session_days
          GROUP BY day
          ORDER BY day ASC
        `,
      ),
      query<TopPageRow[]>(
        `
          SELECT
            page_path,
            COUNT(*) AS pageviews,
            COUNT(DISTINCT COALESCE(NULLIF(session_id, ''), CONCAT(IFNULL(visitor_ip, ''), '#', DATE(created_at)))) AS sessions,
            COALESCE(AVG(visit_duration), 0) AS avg_duration
          FROM page_analytics
          GROUP BY page_path
          ORDER BY pageviews DESC
          LIMIT 8
        `,
      ),
      query<DeviceRow[]>(
        `
          SELECT COALESCE(device_type, 'unknown') AS label, COUNT(*) AS total
          FROM page_analytics
          GROUP BY COALESCE(device_type, 'unknown')
          ORDER BY total DESC
        `,
      ),
      query<CountryRow[]>(
        `
          SELECT COALESCE(NULLIF(country, ''), 'Unknown') AS country, COUNT(*) AS total
          FROM page_analytics
          WHERE country IS NOT NULL
            AND country <> ''
            AND country <> 'Desconocido'
          GROUP BY COALESCE(NULLIF(country, ''), 'Unknown')
          ORDER BY total DESC
          LIMIT 8
        `,
      ),
      query<SourceRow[]>(
        `
          SELECT COALESCE(NULLIF(traffic_source, ''), 'direct') AS source, COUNT(*) AS total
          FROM page_analytics
          GROUP BY COALESCE(NULLIF(traffic_source, ''), 'direct')
          ORDER BY total DESC
          LIMIT 8
        `,
      ),
      query<TotalsRow[]>(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) AS published FROM content_blocks",
      ),
      query<TotalsRow[]>(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) AS published, SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) AS featured FROM services",
      ),
      query<TotalsRow[]>(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) AS published, SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) AS featured FROM projects",
      ),
      query<TotalsRow[]>(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) AS published FROM faq",
      ),
      query<CountRow[]>("SELECT COUNT(*) AS total FROM media"),
      query<HealthRow[]>(
        `
          SELECT block_identifier, is_published
          FROM content_blocks
          WHERE block_identifier IN ('hero', 'about', 'cta')
        `,
      ),
      query<UpdateRow[]>(
        `
          SELECT id, block_name AS title, 'Contenido' AS type, updated_at
          FROM content_blocks
          UNION ALL
          SELECT id, title AS title, 'Proyecto' AS type, updated_at
          FROM projects
          UNION ALL
          SELECT id, COALESCE(name_es, title_es, 'Servicio sin nombre') AS title, 'Servicio' AS type, updated_at
          FROM services
          ORDER BY updated_at DESC
          LIMIT 8
        `,
      ),
      query<CountRow[]>(
        `
          SELECT COUNT(*) AS total
          FROM page_analytics
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
        `,
      ),
      query<CountRow[]>(
        `
          SELECT COUNT(*) AS total
          FROM page_analytics
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 27 DAY)
            AND created_at < DATE_SUB(CURDATE(), INTERVAL 13 DAY)
        `,
      ),
      query<CountRow[]>(
        `
          SELECT COUNT(*) AS total
          FROM page_analytics
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        `,
      ),
      query<CountRow[]>(
        `
          SELECT COUNT(*) AS total
          FROM leads
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        `,
      ),
      query<StatusRow[]>(
        `
          SELECT status, COUNT(*) AS total
          FROM leads
          GROUP BY status
        `,
      ),
      query<CountRow[]>(
        `
          SELECT COUNT(*) AS total
          FROM form_submissions
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        `,
      ),
      query<CountRow[]>("SELECT COUNT(*) AS total FROM form_submissions WHERE is_handled = 0"),
      query<CountRow[]>(
        `
          SELECT COUNT(*) AS total
          FROM whatsapp_conversations
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        `,
      ),
      query<CountRow[]>(
        `
          SELECT COUNT(*) AS total
          FROM whatsapp_conversations
          WHERE status IN ('initiated', 'responded')
        `,
      ),
      query<StatusRow[]>(
        `
          SELECT status, COUNT(*) AS total
          FROM whatsapp_conversations
          GROUP BY status
        `,
      ),
      query<StatusRow[]>(
        `
          SELECT status, COUNT(*) AS total, COALESCE(SUM(total), 0) AS amount
          FROM quotations
          GROUP BY status
        `,
      ),
      query<CountRow[]>("SELECT COALESCE(SUM(total), 0) AS total FROM quotations WHERE status = 'accepted'"),
      query<CountRow[]>(
        `
          SELECT COUNT(*) AS total
          FROM followups
          WHERE status IN ('pending', 'in_progress')
        `,
      ),
      query<CountRow[]>(
        `
          SELECT COUNT(*) AS total
          FROM followups
          WHERE due_date < NOW()
            AND status NOT IN ('completed', 'cancelled')
        `,
      ),
      query<CountRow[]>(
        `
          SELECT COUNT(*) AS total
          FROM meetings
          WHERE DATE(scheduled_at) = CURDATE()
            AND status IN ('scheduled', 'confirmed')
        `,
      ),
      query<CountRow[]>(
        `
          SELECT COUNT(*) AS total
          FROM meetings
          WHERE scheduled_at >= NOW()
            AND status IN ('scheduled', 'confirmed')
        `,
      ),
    ])

    const totalPageviews = toNumber(totalPageviewsRows[0]?.total)
    const totalSessions = toNumber(sessionSummary.total_sessions)
    const engagedSessions = toNumber(sessionSummary.engaged_sessions)
    const engagementRate = totalSessions > 0 ? Math.round((engagedSessions / totalSessions) * 100) : 0
    const bounceRate = Math.max(0, 100 - engagementRate)
    const pagesPerSession = Number(toNumber(sessionSummary.views_per_session).toFixed(2))
    const averageVisitDuration = Math.round(toNumber(sessionSummary.avg_duration))
    const currentVisitors = toNumber(currentVisitorsRows[0]?.total)
    const mobileVisits = deviceRows
      .filter((row) => row.label === "mobile" || row.label === "tablet")
      .reduce((sum, row) => sum + toNumber(row.total), 0)
    const mobileShare = totalPageviews > 0 ? Math.round((mobileVisits / totalPageviews) * 100) : 0

    const currentPageviews14 = toNumber(currentPageviews14Rows[0]?.total)
    const previousPageviews14 = toNumber(previousPageviews14Rows[0]?.total)
    const pageviewGrowth =
      previousPageviews14 === 0
        ? currentPageviews14 > 0
          ? 100
          : 0
        : Math.round(((currentPageviews14 - previousPageviews14) / previousPageviews14) * 100)

    const visits30 = toNumber(visits30Rows[0]?.total)
    const leads30 = toNumber(leads30Rows[0]?.total)
    const forms30 = toNumber(forms30Rows[0]?.total)
    const whatsapp30 = toNumber(whatsapp30Rows[0]?.total)

    const leadStatusMap = new Map(leadStatusRows.map((row) => [row.status || "unknown", toNumber(row.total)]))
    const qualifiedLeads = ["qualified", "proposal", "won"].reduce((sum, key) => sum + (leadStatusMap.get(key) || 0), 0)
    const proposalLeads = leadStatusMap.get("proposal") || 0
    const wonLeads = leadStatusMap.get("won") || 0

    const quotesStatusMap = new Map(
      quotesStatusRows.map((row) => [row.status || "unknown", { total: toNumber(row.total), amount: toNumber(row.amount) }]),
    )
    const acceptedQuotes = quotesStatusMap.get("accepted") || { total: 0, amount: 0 }
    const sentQuotes = quotesStatusMap.get("sent") || { total: 0, amount: 0 }
    const viewedQuotes = quotesStatusMap.get("viewed") || { total: 0, amount: 0 }

    const whatsappStatusMap = new Map(whatsappStatusRows.map((row) => [row.status || "unknown", toNumber(row.total)]))
    const whatsappConverted = whatsappStatusMap.get("converted") || 0

    const leadConversionRate = visits30 > 0 ? Number(((leads30 / visits30) * 100).toFixed(1)) : 0
    const quoteAcceptanceRate =
      acceptedQuotes.total + sentQuotes.total + viewedQuotes.total > 0
        ? Math.round((acceptedQuotes.total / (acceptedQuotes.total + sentQuotes.total + viewedQuotes.total)) * 100)
        : 0

    const content = contentRows[0] || { total: 0, published: 0 }
    const services = serviceRows[0] || { total: 0, published: 0, featured: 0 }
    const projects = projectRows[0] || { total: 0, published: 0, featured: 0 }
    const faq = faqRows[0] || { total: 0, published: 0 }
    const media = mediaRows[0] || { total: 0 }

    const requiredBlocks = ["hero", "about", "cta"]
    const publishedBlocks = new Set(
      healthRows.filter((row) => toNumber(row.is_published) === 1).map((row) => row.block_identifier),
    )
    const missingBlocks = requiredBlocks.filter((block) => !publishedBlocks.has(block))
    const contentHealthScore = Math.round(
      ((toNumber(content.published) > 0 ? 1 : 0) +
        (toNumber(services.published) > 0 ? 1 : 0) +
        (toNumber(projects.published) > 0 ? 1 : 0) +
        (requiredBlocks.length - missingBlocks.length) / requiredBlocks.length) /
        4 *
        100,
    )

    const pageviewSeries30 = fillDailySeries(pageviewTrendRows, 30)
    const sessionSeries30 = fillDailySeries(sessionTrendRows, 30)

    const alerts = [
      toNumber(unhandledFormsRows[0]?.total) > 0 ? `${toNumber(unhandledFormsRows[0]?.total)} formularios siguen sin gestionar.` : null,
      toNumber(followupsOverdueRows[0]?.total) > 0 ? `${toNumber(followupsOverdueRows[0]?.total)} seguimientos estan vencidos.` : null,
      totalPageviews > 0 && countryRows.length === 0
        ? "Las visitas historicas aun no tienen pais identificado; las nuevas sesiones ya se registran con geolocalizacion cuando el hosting la expone."
        : null,
    ].filter(Boolean)

    return NextResponse.json({
      summary: {
        totalPageviews,
        totalSessions,
        currentVisitors,
        engagedSessions,
        engagementRate,
        bounceRate,
        pagesPerSession,
        averageVisitDuration,
        pageviewGrowth,
        mobileShare,
        countriesTracked: countryRows.length,
        leads30,
        forms30,
        whatsapp30,
        leadConversionRate,
        quoteAcceptanceRate,
        acceptedRevenue: toNumber(acceptedRevenueRows[0]?.total),
        pendingFollowups: toNumber(followupsPendingRows[0]?.total),
        overdueFollowups: toNumber(followupsOverdueRows[0]?.total),
        meetingsToday: toNumber(meetingsTodayRows[0]?.total),
        contentHealthScore,
      },
      traffic: {
        pageviews30: pageviewSeries30.map((item) => ({ day: item.day, total: item.value })),
        sessions30: sessionSeries30.map((item) => ({ day: item.day, total: item.value })),
      },
      devices: deviceRows.map((row) => ({
        label: row.label || "unknown",
        total: toNumber(row.total),
      })),
      topPages: topPagesRows.map((row) => ({
        page: row.page_path || "/",
        pageviews: toNumber(row.pageviews),
        sessions: toNumber(row.sessions),
        avgDuration: Math.round(toNumber(row.avg_duration)),
      })),
      topCountries: countryRows.map((row) => ({
        country: row.country || "Unknown",
        total: toNumber(row.total),
      })),
      topSources: sourceRows.map((row) => ({
        source: formatSource(row.source),
        total: toNumber(row.total),
      })),
      funnel: {
        visits30,
        forms30,
        leads30,
        qualifiedLeads,
        proposalLeads,
        wonLeads,
      },
      sales: {
        acceptedQuotes: acceptedQuotes.total,
        viewedQuotes: viewedQuotes.total,
        sentQuotes: sentQuotes.total,
        acceptedRevenue: toNumber(acceptedRevenueRows[0]?.total),
      },
      operations: {
        unhandledForms: toNumber(unhandledFormsRows[0]?.total),
        whatsappOpen: toNumber(whatsappOpenRows[0]?.total),
        whatsappConverted,
        pendingFollowups: toNumber(followupsPendingRows[0]?.total),
        overdueFollowups: toNumber(followupsOverdueRows[0]?.total),
        meetingsToday: toNumber(meetingsTodayRows[0]?.total),
        meetingsUpcoming: toNumber(meetingsUpcomingRows[0]?.total),
      },
      content: {
        blocks: toNumber(content.total),
        blocksPublished: toNumber(content.published),
        services: toNumber(services.total),
        servicesPublished: toNumber(services.published),
        servicesFeatured: toNumber(services.featured),
        projects: toNumber(projects.total),
        projectsPublished: toNumber(projects.published),
        projectsFeatured: toNumber(projects.featured),
        faq: toNumber(faq.total),
        faqPublished: toNumber(faq.published),
        media: toNumber(media.total),
      },
      health: {
        missingBlocks,
        emptyCollections: [
          toNumber(content.total) === 0 ? "content_blocks" : null,
          toNumber(services.total) === 0 ? "services" : null,
          toNumber(projects.total) === 0 ? "projects" : null,
        ].filter(Boolean),
      },
      recentUpdates,
      alerts,
    })
  } catch (error) {
    console.error("Error building admin dashboard:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

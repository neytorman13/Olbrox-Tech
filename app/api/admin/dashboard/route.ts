export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { ensureAnalyticsSchema } from "@/lib/analytics-server"

type CountRow = { total: number }
type TotalsRow = { total: number; published?: number; featured?: number }
type TrendRow = { day: string; visits: number }
type DeviceRow = { label: string | null; total: number }
type PageRow = { page_path: string | null; total: number }
type CountryRow = { country: string | null; total: number }
type SourceRow = { source: string | null; total: number }
type HealthRow = { block_identifier: string; is_published: number }
type UpdateRow = { id: string; title: string; type: string; updated_at: string }
type StatusRow = { status: string | null; total: number; amount?: number | string | null }

function toNumber(value: unknown) {
  return Number(value || 0)
}

function formatDayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function buildTrendWindow(rows: TrendRow[], days: number) {
  const map = new Map(rows.map((row) => [row.day, toNumber(row.visits)]))
  const result: Array<{ day: string; visits: number }> = []
  const today = new Date()

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - index)
    const key = formatDayKey(date)
    result.push({
      day: key,
      visits: map.get(key) || 0,
    })
  }

  return result
}

function sanitizeCountryLabel(country: string | null) {
  if (!country || country === "Desconocido") return null
  return country
}

function sanitizeSourceLabel(source: string | null) {
  if (!source) return "directo"
  return source
}

export async function GET() {
  try {
    await ensureAnalyticsSchema()

    const [
      contentRows,
      serviceRows,
      projectRows,
      faqRows,
      mediaRows,
      visitRows,
      uniqueSessionsRows,
      avgDurationRows,
      topPagesRows,
      deviceRows,
      countryCoverageRows,
      countryRows,
      sourceRows,
      healthRows,
      recentUpdates,
      traffic14Rows,
      currentTraffic14Rows,
      recentVisits30Rows,
      leads30Rows,
      leadsByStatusRows,
      forms30Rows,
      unhandledFormsRows,
      whatsapp30Rows,
      whatsappOpenRows,
      whatsappByStatusRows,
      quotesByStatusRows,
      acceptedQuotesAmountRows,
      followupsPendingRows,
      followupsOverdueRows,
      meetingsTodayRows,
      meetingsUpcomingRows,
    ] = await Promise.all([
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
      query<CountRow[]>("SELECT COUNT(*) AS total FROM page_analytics"),
      query<CountRow[]>(
        "SELECT COUNT(DISTINCT COALESCE(NULLIF(session_id, ''), CONCAT(IFNULL(visitor_ip, ''), '#', DATE(created_at)))) AS total FROM page_analytics",
      ),
      query<CountRow[]>("SELECT COALESCE(AVG(visit_duration), 0) AS total FROM page_analytics"),
      query<PageRow[]>(
        `
          SELECT page_path, COUNT(*) AS total
          FROM page_analytics
          GROUP BY page_path
          ORDER BY total DESC
          LIMIT 6
        `,
      ),
      query<DeviceRow[]>(
        `
          SELECT COALESCE(device_type, 'unknown') AS label, COUNT(*) AS total
          FROM page_analytics
          GROUP BY device_type
          ORDER BY total DESC
        `,
      ),
      query<CountRow[]>(
        `
          SELECT COUNT(DISTINCT NULLIF(country, '')) AS total
          FROM page_analytics
          WHERE country IS NOT NULL
            AND country <> ''
            AND country <> 'Desconocido'
        `,
      ),
      query<CountryRow[]>(
        `
          SELECT COALESCE(NULLIF(country, ''), 'Desconocido') AS country, COUNT(*) AS total
          FROM page_analytics
          GROUP BY COALESCE(NULLIF(country, ''), 'Desconocido')
          ORDER BY total DESC
          LIMIT 8
        `,
      ),
      query<SourceRow[]>(
        `
          SELECT COALESCE(NULLIF(traffic_source, ''), 'directo') AS source, COUNT(*) AS total
          FROM page_analytics
          GROUP BY COALESCE(NULLIF(traffic_source, ''), 'directo')
          ORDER BY total DESC
          LIMIT 8
        `,
      ),
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
      query<TrendRow[]>(
        `
          SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS visits
          FROM page_analytics
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
          GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
          ORDER BY day ASC
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
      query<CountRow[]>(
        `
          SELECT COUNT(*) AS total
          FROM form_submissions
          WHERE is_handled = 0
        `,
      ),
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
      query<CountRow[]>(
        `
          SELECT COALESCE(SUM(total), 0) AS total
          FROM quotations
          WHERE status = 'accepted'
        `,
      ),
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

    const previousWindowRows = await query<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM page_analytics
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 27 DAY)
          AND created_at < DATE_SUB(CURDATE(), INTERVAL 13 DAY)
      `,
    )

    const content = contentRows[0] || { total: 0, published: 0 }
    const services = serviceRows[0] || { total: 0, published: 0, featured: 0 }
    const projects = projectRows[0] || { total: 0, published: 0, featured: 0 }
    const faq = faqRows[0] || { total: 0, published: 0 }
    const media = mediaRows[0] || { total: 0 }
    const visits = visitRows[0] || { total: 0 }
    const uniqueSessions = uniqueSessionsRows[0] || { total: 0 }
    const avgDuration = avgDurationRows[0] || { total: 0 }
    const currentVisits14 = toNumber(currentTraffic14Rows[0]?.total)
    const previousVisits14 = toNumber(previousWindowRows[0]?.total)
    const visits30 = toNumber(recentVisits30Rows[0]?.total)
    const leads30 = toNumber(leads30Rows[0]?.total)
    const forms30 = toNumber(forms30Rows[0]?.total)
    const whatsapp30 = toNumber(whatsapp30Rows[0]?.total)
    const totalCountryCoverage = toNumber(countryCoverageRows[0]?.total)
    const mobileVisits = deviceRows
      .filter((row) => row.label === "mobile" || row.label === "tablet")
      .reduce((sum, row) => sum + toNumber(row.total), 0)
    const mobileShare = toNumber(visits.total) > 0 ? Math.round((mobileVisits / toNumber(visits.total)) * 100) : 0

    const leadsStatusMap = new Map(leadsByStatusRows.map((row) => [row.status || "unknown", toNumber(row.total)]))
    const qualifiedLeads = ["qualified", "proposal", "won"].reduce((sum, key) => sum + (leadsStatusMap.get(key) || 0), 0)
    const wonLeads = leadsStatusMap.get("won") || 0
    const proposalLeads = leadsStatusMap.get("proposal") || 0
    const newLeads = leadsStatusMap.get("new") || 0

    const quotesStatusMap = new Map(
      quotesByStatusRows.map((row) => [row.status || "unknown", { total: toNumber(row.total), amount: toNumber(row.amount) }]),
    )
    const acceptedQuotes = quotesStatusMap.get("accepted") || { total: 0, amount: 0 }
    const sentQuotes = quotesStatusMap.get("sent") || { total: 0, amount: 0 }
    const viewedQuotes = quotesStatusMap.get("viewed") || { total: 0, amount: 0 }

    const whatsappStatusMap = new Map(whatsappByStatusRows.map((row) => [row.status || "unknown", toNumber(row.total)]))
    const whatsappConverted = whatsappStatusMap.get("converted") || 0

    const leadConversionRate = visits30 > 0 ? Math.round((leads30 / visits30) * 1000) / 10 : 0
    const quoteAcceptanceRate =
      acceptedQuotes.total + sentQuotes.total + viewedQuotes.total > 0
        ? Math.round((acceptedQuotes.total / (acceptedQuotes.total + sentQuotes.total + viewedQuotes.total)) * 100)
        : 0

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

    const trafficGrowth =
      previousVisits14 === 0 ? (currentVisits14 > 0 ? 100 : 0) : Math.round(((currentVisits14 - previousVisits14) / previousVisits14) * 100)

    const countries = countryRows
      .map((row) => ({
        country: row.country || "Desconocido",
        total: toNumber(row.total),
      }))
      .filter((row) => sanitizeCountryLabel(row.country))

    const sources = sourceRows
      .map((row) => ({
        source: sanitizeSourceLabel(row.source),
        total: toNumber(row.total),
      }))
      .filter((row) => row.total > 0)

    const topCountry = countries[0] || null
    const topSource = sources[0] || null
    const trends = buildTrendWindow(traffic14Rows, 14)

    const operationalAlerts = [
      toNumber(unhandledFormsRows[0]?.total) > 0 ? `${toNumber(unhandledFormsRows[0]?.total)} formularios siguen sin gestionar.` : null,
      toNumber(followupsOverdueRows[0]?.total) > 0 ? `${toNumber(followupsOverdueRows[0]?.total)} seguimientos estan vencidos.` : null,
      totalCountryCoverage === 0 && toNumber(visits.total) > 0
        ? "Las visitas historicas aun no tienen pais identificado; el enriquecimiento aplicara a las nuevas sesiones."
        : null,
    ].filter(Boolean)

    return NextResponse.json({
      summary: {
        contentBlocks: toNumber(content.total),
        contentBlocksPublished: toNumber(content.published),
        services: toNumber(services.total),
        servicesPublished: toNumber(services.published),
        servicesFeatured: toNumber(services.featured),
        projects: toNumber(projects.total),
        projectsPublished: toNumber(projects.published),
        projectsFeatured: toNumber(projects.featured),
        faq: toNumber(faq.total),
        faqPublished: toNumber(faq.published),
        media: toNumber(media.total),
        totalVisits: toNumber(visits.total),
        uniqueSessions: toNumber(uniqueSessions.total),
        avgVisitDuration: Math.round(toNumber(avgDuration.total)),
        trafficGrowth,
        contentHealthScore,
        countryCoverage: totalCountryCoverage,
        mobileShare,
        leads30,
        forms30,
        whatsapp30,
        leadConversionRate,
        quoteAcceptanceRate,
        acceptedRevenue: toNumber(acceptedQuotesAmountRows[0]?.total),
        pipelineOpen: toNumber(followupsPendingRows[0]?.total) + toNumber(meetingsUpcomingRows[0]?.total),
      },
      trends,
      devices: deviceRows.map((row) => ({
        label: row.label || "unknown",
        total: toNumber(row.total),
      })),
      countries,
      sources,
      topPages: topPagesRows.map((row) => ({
        page: row.page_path || "/",
        total: toNumber(row.total),
      })),
      insights: {
        topCountry,
        topSource,
        topPage: topPagesRows[0]
          ? {
              page: topPagesRows[0].page_path || "/",
              total: toNumber(topPagesRows[0].total),
            }
          : null,
        busiestLeadStage: {
          label: "Nuevos leads",
          total: newLeads,
        },
      },
      funnel: {
        visits30,
        forms30,
        leads30,
        qualifiedLeads,
        proposalLeads,
        wonLeads,
      },
      sales: {
        quotesAccepted: acceptedQuotes.total,
        quotesViewed: viewedQuotes.total,
        quotesSent: sentQuotes.total,
        acceptedRevenue: toNumber(acceptedQuotesAmountRows[0]?.total),
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
      recentUpdates,
      alerts: operationalAlerts,
      health: {
        missingBlocks,
        emptyCollections: [
          toNumber(content.total) === 0 ? "content_blocks" : null,
          toNumber(services.total) === 0 ? "services" : null,
          toNumber(projects.total) === 0 ? "projects" : null,
        ].filter(Boolean),
      },
    })
  } catch (error) {
    console.error("Error building admin dashboard:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { ensureAnalyticsSchema } from "@/lib/analytics-server"

type CountRow = { total: number }
type TrendRow = { day: string; visits: number }
type DeviceRow = { label: string | null; total: number }
type PageRow = { page_path: string | null; total: number }
type CountryRow = { country: string | null; total: number }
type SourceRow = { source: string | null; total: number }
type HealthRow = { block_identifier: string; is_published: number }
type UpdateRow = { id: string; title: string; type: string; updated_at: string }

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
      topPages,
      deviceRows,
      countryCoverageRows,
      countryRows,
      sourceRows,
      healthRows,
      recentUpdates,
      traffic14,
      trafficPrev14,
    ] = await Promise.all([
      query<CountRow[]>(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) AS published FROM content_blocks",
      ),
      query<CountRow[]>(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) AS published, SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) AS featured FROM services",
      ),
      query<CountRow[]>(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) AS published, SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) AS featured FROM projects",
      ),
      query<CountRow[]>(
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
          LIMIT 5
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
        `,
      ),
      query<CountryRow[]>(
        `
          SELECT COALESCE(NULLIF(country, ''), 'Desconocido') AS country, COUNT(*) AS total
          FROM page_analytics
          GROUP BY COALESCE(NULLIF(country, ''), 'Desconocido')
          ORDER BY total DESC
          LIMIT 6
        `,
      ),
      query<SourceRow[]>(
        `
          SELECT COALESCE(NULLIF(traffic_source, ''), 'directo') AS source, COUNT(*) AS total
          FROM page_analytics
          GROUP BY COALESCE(NULLIF(traffic_source, ''), 'directo')
          ORDER BY total DESC
          LIMIT 6
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
    ])

    const previousWindow = await query<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM page_analytics
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 27 DAY)
          AND created_at < DATE_SUB(CURDATE(), INTERVAL 13 DAY)
      `,
    )

    const content = (contentRows[0] as any) || { total: 0, published: 0 }
    const services = (serviceRows[0] as any) || { total: 0, published: 0, featured: 0 }
    const projects = (projectRows[0] as any) || { total: 0, published: 0, featured: 0 }
    const faq = (faqRows[0] as any) || { total: 0, published: 0 }
    const media = mediaRows[0] || { total: 0 }
    const visits = visitRows[0] || { total: 0 }
    const uniqueSessions = uniqueSessionsRows[0] || { total: 0 }
    const avgDuration = avgDurationRows[0] || { total: 0 }
    const currentVisits = Number((trafficPrev14[0] || { total: 0 }).total || 0)
    const previousVisits = Number((previousWindow[0] || { total: 0 }).total || 0)
    const totalCountryCoverage = Number((countryCoverageRows[0] || { total: 0 }).total || 0)
    const topCountry = countryRows[0] || null
    const topSource = sourceRows[0] || null
    const mobileVisits = deviceRows
      .filter((row) => row.label === "mobile" || row.label === "tablet")
      .reduce((sum, row) => sum + Number(row.total || 0), 0)
    const mobileShare = Number(visits.total || 0) > 0 ? Math.round((mobileVisits / Number(visits.total || 0)) * 100) : 0

    const requiredBlocks = ["hero", "about", "cta"]
    const publishedBlocks = new Set(
      healthRows.filter((row) => Number(row.is_published) === 1).map((row) => row.block_identifier),
    )
    const missingBlocks = requiredBlocks.filter((block) => !publishedBlocks.has(block))

    const contentHealthScore = Math.round(
      ((Number(content.published || 0) > 0 ? 1 : 0) +
        (Number(services.published || 0) > 0 ? 1 : 0) +
        (Number(projects.published || 0) > 0 ? 1 : 0) +
        (requiredBlocks.length - missingBlocks.length) / requiredBlocks.length) /
        4 *
        100,
    )

    const trafficGrowth =
      previousVisits === 0
        ? currentVisits > 0
          ? 100
          : 0
        : Math.round(((currentVisits - previousVisits) / previousVisits) * 100)

    return NextResponse.json({
      summary: {
        contentBlocks: Number(content.total || 0),
        contentBlocksPublished: Number(content.published || 0),
        services: Number(services.total || 0),
        servicesPublished: Number(services.published || 0),
        servicesFeatured: Number(services.featured || 0),
        projects: Number(projects.total || 0),
        projectsPublished: Number(projects.published || 0),
        projectsFeatured: Number(projects.featured || 0),
        faq: Number(faq.total || 0),
        faqPublished: Number(faq.published || 0),
        media: Number(media.total || 0),
        totalVisits: Number(visits.total || 0),
        uniqueSessions: Number(uniqueSessions.total || 0),
        avgVisitDuration: Math.round(Number(avgDuration.total || 0)),
        trafficGrowth,
        contentHealthScore,
        countryCoverage: totalCountryCoverage,
        mobileShare,
      },
      trends: traffic14,
      devices: deviceRows.map((row) => ({
        label: row.label || "unknown",
        total: Number(row.total || 0),
      })),
      countries: countryRows.map((row) => ({
        country: row.country || "Desconocido",
        total: Number(row.total || 0),
      })),
      sources: sourceRows.map((row) => ({
        source: row.source || "directo",
        total: Number(row.total || 0),
      })),
      topPages: topPages.map((row) => ({
        page: row.page_path || "/",
        total: Number(row.total || 0),
      })),
      insights: {
        topCountry: topCountry
          ? {
              country: topCountry.country || "Desconocido",
              total: Number(topCountry.total || 0),
            }
          : null,
        topSource: topSource
          ? {
              source: topSource.source || "directo",
              total: Number(topSource.total || 0),
            }
          : null,
      },
      recentUpdates,
      health: {
        missingBlocks,
        emptyCollections: [
          Number(content.total || 0) === 0 ? "content_blocks" : null,
          Number(services.total || 0) === 0 ? "services" : null,
          Number(projects.total || 0) === 0 ? "projects" : null,
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

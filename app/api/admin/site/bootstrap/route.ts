export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { query, querySingle } from "@/lib/db"
import { defaultContentBlocks, defaultProjects, defaultServices } from "@/lib/site-defaults"
import { slugifyService } from "@/lib/services"

async function columnExists(table: string, column: string) {
  const row = await querySingle<{ total: number }>(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [table, column],
  )

  return Number(row?.total || 0) > 0
}

async function ensureServicesSchema() {
  const columns = {
    name_es: await columnExists("services", "name_es"),
    name_en: await columnExists("services", "name_en"),
    name_pt: await columnExists("services", "name_pt"),
    title_es: await columnExists("services", "title_es"),
    title_en: await columnExists("services", "title_en"),
    title_pt: await columnExists("services", "title_pt"),
    features: await columnExists("services", "features"),
    is_featured: await columnExists("services", "is_featured"),
    slug: await columnExists("services", "slug"),
    hero_title: await columnExists("services", "hero_title"),
    hero_description: await columnExists("services", "hero_description"),
    detail_content: await columnExists("services", "detail_content"),
    process_steps: await columnExists("services", "process_steps"),
    deliverables: await columnExists("services", "deliverables"),
    use_cases: await columnExists("services", "use_cases"),
  }

  if (!columns.name_es) await query("ALTER TABLE services ADD COLUMN name_es TEXT NULL AFTER id")
  if (!columns.name_en) await query("ALTER TABLE services ADD COLUMN name_en TEXT NULL AFTER name_es")
  if (!columns.name_pt) await query("ALTER TABLE services ADD COLUMN name_pt TEXT NULL AFTER name_en")
  if (!columns.title_es) await query("ALTER TABLE services ADD COLUMN title_es TEXT NULL AFTER name_pt")
  if (!columns.title_en) await query("ALTER TABLE services ADD COLUMN title_en TEXT NULL AFTER title_es")
  if (!columns.title_pt) await query("ALTER TABLE services ADD COLUMN title_pt TEXT NULL AFTER title_en")
  if (!columns.features) await query("ALTER TABLE services ADD COLUMN features JSON NULL AFTER icon")
  if (!columns.is_featured) await query("ALTER TABLE services ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE AFTER features")
  if (!columns.slug) await query("ALTER TABLE services ADD COLUMN slug VARCHAR(191) NULL AFTER display_order")
  if (!columns.hero_title) await query("ALTER TABLE services ADD COLUMN hero_title TEXT NULL AFTER slug")
  if (!columns.hero_description) await query("ALTER TABLE services ADD COLUMN hero_description TEXT NULL AFTER hero_title")
  if (!columns.detail_content) await query("ALTER TABLE services ADD COLUMN detail_content LONGTEXT NULL AFTER hero_description")
  if (!columns.process_steps) await query("ALTER TABLE services ADD COLUMN process_steps JSON NULL AFTER detail_content")
  if (!columns.deliverables) await query("ALTER TABLE services ADD COLUMN deliverables JSON NULL AFTER process_steps")
  if (!columns.use_cases) await query("ALTER TABLE services ADD COLUMN use_cases JSON NULL AFTER deliverables")

  if (columns.title_es) {
    await query("UPDATE services SET name_es = COALESCE(NULLIF(name_es, ''), title_es) WHERE name_es IS NULL OR name_es = ''")
  }
  if (columns.title_en) {
    await query("UPDATE services SET name_en = COALESCE(NULLIF(name_en, ''), title_en) WHERE name_en IS NULL OR name_en = ''")
  }
  if (columns.title_pt) {
    await query("UPDATE services SET name_pt = COALESCE(NULLIF(name_pt, ''), title_pt) WHERE name_pt IS NULL OR name_pt = ''")
  }

  const rows = await query<Array<{ id: string; name_es: string | null; title_es: string | null; slug: string | null }>>(
    "SELECT id, name_es, title_es, slug FROM services",
  )

  for (const row of rows) {
    const title = row.name_es || row.title_es || "servicio"
    const slug = row.slug || slugifyService(title)
    await query("UPDATE services SET slug = ? WHERE id = ?", [slug, row.id])
  }

  for (const service of defaultServices) {
    await query(
      `
        UPDATE services
        SET
          slug = COALESCE(NULLIF(slug, ''), ?),
          hero_title = COALESCE(NULLIF(hero_title, ''), ?),
          hero_description = COALESCE(NULLIF(hero_description, ''), ?),
          detail_content = COALESCE(NULLIF(detail_content, ''), ?),
          process_steps = COALESCE(process_steps, ?),
          deliverables = COALESCE(deliverables, ?),
          use_cases = COALESCE(use_cases, ?)
        WHERE name_es = ? OR title_es = ? OR slug = ?
      `,
      [
        service.slug,
        service.hero_title,
        service.hero_description,
        service.detail_content,
        JSON.stringify(service.process_steps),
        JSON.stringify(service.deliverables),
        JSON.stringify(service.use_cases),
        service.name_es,
        service.name_es,
        service.slug,
      ],
    )
  }
}

async function ensureContentBlocks() {
  const row = await querySingle<{ total: number }>("SELECT COUNT(*) AS total FROM content_blocks")
  if (Number(row?.total || 0) > 0) return

  for (const block of defaultContentBlocks) {
    await query(
      `
        INSERT INTO content_blocks (
          id,
          block_identifier,
          block_name,
          block_type,
          content,
          is_published,
          updated_at
        ) VALUES (UUID(), ?, ?, ?, ?, ?, NOW())
      `,
      [block.block_identifier, block.block_name, block.block_type, JSON.stringify(block.content), block.is_published],
    )
  }
}

async function ensureProjects() {
  const row = await querySingle<{ total: number }>("SELECT COUNT(*) AS total FROM projects")
  if (Number(row?.total || 0) > 0) return

  for (const project of defaultProjects) {
    await query(
      `
        INSERT INTO projects (
          id,
          title,
          description_es,
          description_en,
          description_pt,
          image_url,
          project_url,
          tags,
          gradient,
          is_featured,
          is_published,
          display_order,
          created_at,
          updated_at
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        project.title,
        project.description_es,
        project.description_en,
        project.description_pt,
        project.image_url,
        project.project_url,
        JSON.stringify(project.tags),
        project.gradient,
        project.is_featured,
        project.is_published,
        project.display_order,
      ],
    )
  }
}

async function ensureServices() {
  const row = await querySingle<{ total: number }>("SELECT COUNT(*) AS total FROM services")
  if (Number(row?.total || 0) > 0) return

  for (const service of defaultServices) {
    await query(
      `
        INSERT INTO services (
          id,
          name_es,
          name_en,
          name_pt,
          title_es,
          title_en,
          title_pt,
          description_es,
          description_en,
          description_pt,
          icon,
          features,
          is_featured,
          is_published,
          display_order,
          slug,
          hero_title,
          hero_description,
          detail_content,
          process_steps,
          deliverables,
          use_cases,
          created_at,
          updated_at
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        service.name_es,
        service.name_en,
        service.name_pt,
        service.name_es,
        service.name_en,
        service.name_pt,
        service.description_es,
        service.description_en,
        service.description_pt,
        service.icon,
        JSON.stringify(service.features),
        service.is_featured,
        service.is_published,
        service.display_order,
        service.slug,
        service.hero_title,
        service.hero_description,
        service.detail_content,
        JSON.stringify(service.process_steps),
        JSON.stringify(service.deliverables),
        JSON.stringify(service.use_cases),
      ],
    )
  }
}

async function collectCounts() {
  const [contentBlocks, services, projects, faq, media, visits] = await Promise.all([
    querySingle<{ total: number }>("SELECT COUNT(*) AS total FROM content_blocks"),
    querySingle<{ total: number }>("SELECT COUNT(*) AS total FROM services"),
    querySingle<{ total: number }>("SELECT COUNT(*) AS total FROM projects"),
    querySingle<{ total: number }>("SELECT COUNT(*) AS total FROM faq"),
    querySingle<{ total: number }>("SELECT COUNT(*) AS total FROM media"),
    querySingle<{ total: number }>("SELECT COUNT(*) AS total FROM page_analytics"),
  ])

  return {
    content_blocks: Number(contentBlocks?.total || 0),
    services: Number(services?.total || 0),
    projects: Number(projects?.total || 0),
    faq: Number(faq?.total || 0),
    media: Number(media?.total || 0),
    page_analytics: Number(visits?.total || 0),
  }
}

export async function POST() {
  try {
    await ensureServicesSchema()
    await ensureContentBlocks()
    await ensureProjects()
    await ensureServices()

    return NextResponse.json({
      ok: true,
      counts: await collectCounts(),
    })
  } catch (error) {
    console.error("Error bootstrapping admin site data:", error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

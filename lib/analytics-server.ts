import { query } from "@/lib/db"

let analyticsSchemaPromise: Promise<void> | null = null

function isIgnorableColumnError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return (
    message.includes("duplicate column") ||
    message.includes("already exists") ||
    message.includes("duplicate name")
  )
}

export async function ensureAnalyticsSchema() {
  if (!analyticsSchemaPromise) {
    analyticsSchemaPromise = (async () => {
      const statements = [
        "ALTER TABLE page_analytics ADD COLUMN country_code VARCHAR(8) NULL",
        "ALTER TABLE page_analytics ADD COLUMN region TEXT NULL",
        "ALTER TABLE page_analytics ADD COLUMN traffic_source VARCHAR(191) NULL",
        "ALTER TABLE page_analytics ADD COLUMN utm_source VARCHAR(191) NULL",
        "ALTER TABLE page_analytics ADD COLUMN utm_medium VARCHAR(191) NULL",
        "ALTER TABLE page_analytics ADD COLUMN utm_campaign VARCHAR(191) NULL",
      ]

      for (const statement of statements) {
        try {
          await query(statement)
        } catch (error) {
          if (!isIgnorableColumnError(error)) {
            throw error
          }
        }
      }
    })().catch((error) => {
      analyticsSchemaPromise = null
      throw error
    })
  }

  await analyticsSchemaPromise
}

export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null
  }

  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || null
}

function countryNameFromCode(code: string | null | undefined) {
  if (!code) return null

  try {
    return new Intl.DisplayNames(["es"], { type: "region" }).of(code.toUpperCase()) || code.toUpperCase()
  } catch {
    return code.toUpperCase()
  }
}

export function getGeoFromHeaders(headers: Headers) {
  const countryCode =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country-code") ||
    null

  const region =
    headers.get("x-vercel-ip-country-region") ||
    headers.get("x-region") ||
    null

  const city =
    headers.get("x-vercel-ip-city") ||
    headers.get("x-city") ||
    null

  return {
    countryCode: countryCode?.toUpperCase() || null,
    country: countryNameFromCode(countryCode),
    region,
    city,
  }
}

export function getTrafficSource(referrer: string | null | undefined, utmSource?: string | null) {
  if (utmSource) {
    return utmSource.trim().toLowerCase()
  }

  if (!referrer) {
    return "directo"
  }

  try {
    return new URL(referrer).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return "directo"
  }
}

export function getDeviceType(userAgent: string): "desktop" | "mobile" | "tablet" {
  const ua = userAgent.toLowerCase()
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet"
  }
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return "mobile"
  }
  return "desktop"
}

export function getBrowser(userAgent: string) {
  const ua = userAgent.toLowerCase()
  if (ua.includes("firefox")) return "Firefox"
  if (ua.includes("edg")) return "Edge"
  if (ua.includes("chrome")) return "Chrome"
  if (ua.includes("safari")) return "Safari"
  if (ua.includes("opera") || ua.includes("opr")) return "Opera"
  return "Other"
}

export function getOS(userAgent: string) {
  const ua = userAgent.toLowerCase()
  if (ua.includes("windows")) return "Windows"
  if (ua.includes("mac os") || ua.includes("macos")) return "macOS"
  if (ua.includes("linux")) return "Linux"
  if (ua.includes("android")) return "Android"
  if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) return "iOS"
  return "Other"
}

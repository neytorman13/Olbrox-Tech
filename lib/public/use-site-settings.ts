"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"

export interface SiteSettings {
  site_name: string
  site_tagline: string
  contact_email: string
  contact_phone: string
  whatsapp_number: string
  address: string
  business_hours: string
  social_facebook: string
  social_instagram: string
  social_tiktok: string
  social_linkedin: string
  social_twitter: string
  social_github: string
}

const DEFAULTS: SiteSettings = {
  site_name: "Olbrox Tech",
  site_tagline: "Desarrollo de Software Profesional",
  contact_email: "olbrox.tech@gmail.com",
  contact_phone: "+593 985 532 437",
  whatsapp_number: "593985532437",
  address: "Ecuador - Worldwide",
  business_hours: "Lunes a Viernes: 9:00 - 18:00",
  social_facebook: "",
  social_instagram: "",
  social_tiktok: "",
  social_linkedin: "",
  social_twitter: "",
  social_github: "",
}

function unwrap(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string") return value
  return String(value)
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const db = createClient()
        const { data } = await db
          .from("website_settings")
          .select("setting_key, setting_value")
        if (!data) return
        const merged: SiteSettings = { ...DEFAULTS }
        for (const row of data as { setting_key: string; setting_value: unknown }[]) {
          const key = row.setting_key as keyof SiteSettings
          if (key in merged) {
            const v = unwrap(row.setting_value)
            if (v) (merged as any)[key] = v
          }
        }
        setSettings(merged)
      } catch {
        // keep defaults
      } finally {
        setLoaded(true)
      }
    })()
  }, [])

  return { settings, loaded }
}



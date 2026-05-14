"use client"

import { createClient } from "@/lib/db-client"

export type LeadPayload = {
  full_name: string
  email: string
  phone?: string
  company?: string
  message?: string
  source?: string
}

export async function saveLead(payload: LeadPayload): Promise<{ id: string | null; error: string | null }> {
  try {
    const db = createClient()
    const { data, error } = await db
      .from("leads")
      .insert({
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone || null,
        company: payload.company || null,
        message: payload.message || null,
        source: payload.source || "website",
        status: "new",
      })
      .select("id")
      .single()
    if (error) return { id: null, error: error.message }
    return { id: data?.id || null, error: null }
  } catch (e: any) {
    return { id: null, error: e?.message || "unknown" }
  }
}

export async function saveFormSubmission(
  formName: string,
  payload: Record<string, any>,
  leadId?: string | null,
) {
  try {
    const db = createClient()
    await db.from("form_submissions").insert({
      form_name: formName,
      page_path: typeof window !== "undefined" ? window.location.pathname : null,
      payload,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      lead_id: leadId || null,
    })
  } catch {}
}

export async function trackWhatsAppClick(opts: {
  phone: string
  message?: string
  sourceButton?: string
  contactName?: string
  leadId?: string | null
}) {
  try {
    const db = createClient()
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    )
    await db.from("whatsapp_conversations").insert({
      lead_id: opts.leadId || null,
      phone_number: opts.phone,
      contact_name: opts.contactName || null,
      initial_message: opts.message || null,
      source_page: typeof window !== "undefined" ? window.location.pathname : null,
      source_button: opts.sourceButton || null,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      status: "initiated",
    })
  } catch {}
}

export async function trackPageView(pagePath: string) {
  try {
    const db = createClient()
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua)
    const isTablet = /Tablet|iPad/i.test(ua)
    const device_type = isTablet ? "tablet" : isMobile ? "mobile" : "desktop"
    const sessionKey = "olbrox_session_id"
    let sessionId: string | null = null
    if (typeof window !== "undefined") {
      sessionId = sessionStorage.getItem(sessionKey)
      if (!sessionId) {
        sessionId = crypto.randomUUID()
        sessionStorage.setItem(sessionKey, sessionId)
      }
    }
    await db.from("page_analytics").insert({
      page_path: pagePath,
      user_agent: ua || null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      device_type,
      session_id: sessionId,
    })
  } catch {}
}



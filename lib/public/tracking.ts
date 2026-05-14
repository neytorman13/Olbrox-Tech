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

type TrackPageViewPayload = {
  eventId?: string
  pagePath: string
  sessionId?: string | null
  visitDuration?: number
}

function buildPageViewBody(payload: TrackPageViewPayload) {
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()

  return {
    event_id: payload.eventId,
    page_path: payload.pagePath,
    session_id: payload.sessionId || null,
    visit_duration: payload.visitDuration || 0,
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  }
}

export function trackPageViewWithBeacon(payload: TrackPageViewPayload) {
  try {
    if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
      return false
    }

    const blob = new Blob([JSON.stringify(buildPageViewBody(payload))], {
      type: "application/json",
    })

    return navigator.sendBeacon("/api/analytics/track", blob)
  } catch {
    return false
  }
}

export async function trackPageView(payload: TrackPageViewPayload) {
  try {
    const sessionKey = "olbrox_session_id"
    let sessionId = payload.sessionId || null

    if (typeof window !== "undefined") {
      sessionId = sessionId || sessionStorage.getItem(sessionKey)
      if (!sessionId) {
        sessionId = crypto.randomUUID()
        sessionStorage.setItem(sessionKey, sessionId)
      }
    }

    await fetch("/api/analytics/track", {
      method: "POST",
      credentials: "include",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildPageViewBody({ ...payload, sessionId })),
    })
  } catch {}
}

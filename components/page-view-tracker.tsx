"use client"

import { useEffect } from "react"
import { trackPageView, trackPageViewWithBeacon } from "@/lib/public/tracking"

export function PageViewTracker({ path = "/" }: { path?: string }) {
  useEffect(() => {
    const sessionKey = "olbrox_session_id"
    let sessionId: string | null = null

    if (typeof window !== "undefined") {
      sessionId = sessionStorage.getItem(sessionKey)
      if (!sessionId) {
        sessionId = crypto.randomUUID()
        sessionStorage.setItem(sessionKey, sessionId)
      }
    }

    const eventId = crypto.randomUUID()
    const startedAt = Date.now()
    let finalized = false

    void trackPageView({
      eventId,
      pagePath: path,
      sessionId,
      visitDuration: 0,
    })

    const flushVisit = () => {
      if (finalized) return
      finalized = true

      const visitDuration = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
      const payload = {
        eventId,
        pagePath: path,
        sessionId,
        visitDuration,
      }

      if (!trackPageViewWithBeacon(payload)) {
        void trackPageView(payload)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushVisit()
      }
    }

    window.addEventListener("pagehide", flushVisit)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("pagehide", flushVisit)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      flushVisit()
    }
  }, [path])

  return null
}


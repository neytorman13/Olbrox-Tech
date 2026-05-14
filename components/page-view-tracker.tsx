"use client"

import { useEffect } from "react"
import { trackPageView } from "@/lib/public/tracking"

export function PageViewTracker({ path = "/" }: { path?: string }) {
  useEffect(() => {
    void trackPageView(path)
  }, [path])

  return null
}


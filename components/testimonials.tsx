"use client"

import { motion, useInView } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Quote, Star } from "lucide-react"
import { useLanguage } from "@/lib/i18n"
import { createClient } from "@/lib/db-client"

interface TestimonialRecord {
  id: string
  client_name: string
  client_company: string | null
  client_position: string | null
  client_avatar: string | null
  content_es: string
  content_en: string | null
  content_pt: string | null
  rating: number
  display_order: number
}

function localized(item: TestimonialRecord, language: string) {
  const key = language === "en" ? "content_en" : language === "pt" ? "content_pt" : "content_es"
  return (item as any)[key] || item.content_es
}

export function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t, language } = useLanguage()
  const [items, setItems] = useState<TestimonialRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const db = createClient()
        const { data, error } = await db
          .from("testimonials")
          .select("*")
          .eq("is_published", true)
          .order("display_order", { ascending: true })
          .limit(12)

        if (error) {
          console.error("Error loading testimonials:", error)
          setItems([])
        } else {
          setItems((data as TestimonialRecord[]) || [])
        }
      } catch (error) {
        console.error("Error loading testimonials:", error)
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (!loading && items.length === 0) return null

  return (
    <section id="testimonios" className="py-24 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wider uppercase mb-6 border border-primary/20">
            {t("testimonials.badge")}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t("testimonials.title.1")}{" "}
            <span className="gradient-text">{t("testimonials.title.2")}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t("testimonials.subtitle")}
          </p>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-card/50 border border-border/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -6 }}
                className="group relative p-8 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50 hover:border-primary/40 transition-all shadow-lg hover:shadow-2xl hover:shadow-primary/10"
              >
                <Quote className="absolute -top-4 -left-2 w-10 h-10 text-primary/20 group-hover:text-primary/40 transition-colors" />

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < (item.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>

                <p className="text-muted-foreground leading-relaxed mb-6 italic">
                  &ldquo;{localized(item, language)}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden">
                    {item.client_avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.client_avatar} alt={item.client_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-primary">
                        {item.client_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.client_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[item.client_position, item.client_company].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}


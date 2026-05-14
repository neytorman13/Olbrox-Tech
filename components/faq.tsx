"use client"

import { motion, AnimatePresence, useInView } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Plus, HelpCircle } from "lucide-react"
import { useLanguage } from "@/lib/i18n"
import { createClient } from "@/lib/db-client"

interface FaqRecord {
  id: string
  question_es: string
  question_en: string | null
  question_pt: string | null
  answer_es: string
  answer_en: string | null
  answer_pt: string | null
  category: string
  display_order: number
}

function pick(item: FaqRecord, field: "question" | "answer", language: string) {
  const suffix = language === "en" ? "en" : language === "pt" ? "pt" : "es"
  const key = `${field}_${suffix}` as keyof FaqRecord
  return (item[key] as string) || (item[`${field}_es` as keyof FaqRecord] as string)
}

export function Faq() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t, language } = useLanguage()
  const [items, setItems] = useState<FaqRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const db = createClient()
      const { data } = await db
        .from("faq")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true })
      setItems((data as FaqRecord[]) || [])
      setLoading(false)
    })()
  }, [])

  if (!loading && items.length === 0) return null

  return (
    <section id="faq" className="py-24 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-background to-card/30" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary tracking-wider uppercase">
              {t("faq.badge")}
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t("faq.title.1")}{" "}
            <span className="gradient-text">{t("faq.title.2")}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t("faq.subtitle")}
          </p>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-card/50 border border-border/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => {
              const isOpen = openId === item.id
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    isOpen
                      ? "bg-card/80 border-primary/40 shadow-lg shadow-primary/5"
                      : "bg-card/50 border-border/50 hover:border-primary/30"
                  }`}
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="group flex w-full items-start justify-between gap-4 px-6 py-5 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 inline-flex rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                        {item.category || "general"}
                      </div>
                      <span className="block break-words pr-2 font-semibold leading-7 text-foreground transition-colors group-hover:text-primary">
                        {pick(item, "question", language)}
                      </span>
                    </div>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                        isOpen ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="break-words px-6 pb-6 leading-7 text-muted-foreground whitespace-pre-line">
                          {pick(item, "answer", language)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}


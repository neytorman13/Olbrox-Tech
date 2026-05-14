"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { useLanguage } from "@/lib/i18n"

interface CtaBlockContent {
  title?: string
  description?: string
  subtitle?: string
  button_text?: string
  button_link?: string
}

interface CtaBlockProps {
  content?: CtaBlockContent | null
}

export function CtaBlock({ content }: CtaBlockProps) {
  if (!content || !content.title || !content.description) {
    return null
  }

  const { t } = useLanguage()
  const buttonText = content.button_text || t("hero.cta.quote")
  const buttonLink = content.button_link || "#contacto"

  return (
    <section id="contacto" className="py-24 bg-gradient-to-b from-primary/10 via-background to-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-[2rem] border border-primary/20 bg-card/80 p-12 shadow-2xl shadow-primary/10"
        >
          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-primary font-semibold mb-4">{content.title}</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
                {content.description}
              </h2>
              {content.subtitle && (
                <p className="text-muted-foreground max-w-2xl leading-relaxed">
                  {content.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center">
              <motion.a
                href={buttonLink}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center rounded-3xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                <span>{buttonText}</span>
                <ArrowRight className="ml-3 h-5 w-5" />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}


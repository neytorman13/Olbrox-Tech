"use client"

import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/db-client"
import { useLanguage } from "@/lib/i18n"
import {
  Globe,
  Smartphone,
  Cog,
  Database,
  ShoppingCart,
  Brain,
  ArrowUpRight,
  Server,
  Shield,
  Brush,
  Bot,
} from "lucide-react"
import { normalizeService, getServiceDescription, getServiceTitle, type ServiceRecord } from "@/lib/services"

const iconLookup = {
  web: Globe,
  mobile: Smartphone,
  automation: Bot,
  custom: Cog,
  ecommerce: ShoppingCart,
  ai: Brain,
  code: Cog,
  database: Database,
  "shopping-cart": ShoppingCart,
  settings: Bot,
  zap: Brain,
  palette: Brush,
  server: Server,
  globe: Globe,
  smartphone: Smartphone,
  lock: Shield,
}

const fallbackServices = [
  {
    name_es: "Desarrollo Web Corporativo",
    description_es: "Sitios web modernos, rapidos y orientados a conversion para empresas y marcas.",
    icon: "globe",
    slug: "desarrollo-web-corporativo",
  },
  {
    name_es: "Aplicaciones Moviles",
    description_es: "Apps escalables para Android y iOS centradas en experiencia de usuario y rendimiento.",
    icon: "smartphone",
    slug: "aplicaciones-moviles",
  },
  {
    name_es: "Automatizacion de Procesos",
    description_es: "Flujos automatizados para ahorrar tiempo, reducir errores y mejorar operaciones.",
    icon: "settings",
    slug: "automatizacion-de-procesos",
  },
  {
    name_es: "Sistemas a Medida",
    description_es: "Soluciones internas adaptadas a procesos comerciales, operativos y administrativos.",
    icon: "code",
    slug: "sistemas-a-medida",
  },
  {
    name_es: "E-commerce",
    description_es: "Tiendas en linea conectadas con pagos, inventario y estrategias de venta digital.",
    icon: "shopping-cart",
    slug: "e-commerce",
  },
  {
    name_es: "Soluciones con IA",
    description_es: "Asistentes, analisis y automatizaciones impulsadas por inteligencia artificial.",
    icon: "zap",
    slug: "soluciones-con-ia",
  },
]

export function Services() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t, language } = useLanguage()
  const [services, setServices] = useState<ServiceRecord[]>([])

  useEffect(() => {
    const db = createClient()

    async function loadServices() {
      const { data, error } = await db
        .from("services")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true })

      if (!error && data && data.length > 0) {
        setServices((data as ServiceRecord[]).map(normalizeService))
      } else {
        setServices(fallbackServices.map((service) => normalizeService(service as ServiceRecord)))
      }
    }

    void loadServices()
  }, [])

  const serviceItems = services.map((service) => ({
    title: getServiceTitle(service, language),
    description: getServiceDescription(service, language),
    icon: service.icon || "code",
    slug: normalizeService(service).slug,
  }))

  return (
    <section id="servicios" className="relative overflow-hidden py-24" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <motion.div
        className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <motion.span
            className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-primary"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
          >
            {t("nav.services")}
          </motion.span>
          <h2 className="mb-6 text-balance text-3xl font-bold md:text-5xl">
            {t("services.title").split("?")[0]}
            <span className="gradient-text">?</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">{t("services.subtitle")}</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {serviceItems.map((service, index) => {
            const Icon = iconLookup[service.icon as keyof typeof iconLookup] || Cog

            return (
              <motion.div
                key={`${service.slug}-${index}`}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -8 }}
                className="group relative"
              >
                <Link href={`/servicios/${service.slug}`} className="block h-full">
                  <div className="relative flex h-full min-h-[20rem] flex-col rounded-3xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all duration-500 hover:border-primary/50">
                    <div className="absolute inset-0 rounded-3xl bg-primary/5 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />

                    <motion.div
                      className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className="h-7 w-7 text-primary" />
                    </motion.div>

                    <h3 className="relative mb-4 flex items-start gap-2 text-2xl font-bold leading-tight transition-colors group-hover:text-primary">
                      <span className="break-words">{service.title}</span>
                      <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-primary opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    </h3>

                    <p className="relative line-clamp-4 break-words text-lg leading-8 text-muted-foreground">
                      {service.description}
                    </p>

                    <div className="mt-auto pt-8">
                      <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                        Ver detalle
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

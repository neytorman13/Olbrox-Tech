import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, CheckCircle2, Cog, Database, Globe, Shield, ShoppingCart, Smartphone, Sparkles, Brain, Server, Brush, Bot } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Contact } from "@/components/contact"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { PageViewTracker } from "@/components/page-view-tracker"
import { querySingle } from "@/lib/db"
import { normalizeService, type ServiceRecord } from "@/lib/services"
import { defaultServices } from "@/lib/site-defaults"

export const dynamic = "force-dynamic"

const iconLookup = {
  globe: Globe,
  smartphone: Smartphone,
  settings: Bot,
  code: Cog,
  "shopping-cart": ShoppingCart,
  zap: Brain,
  server: Server,
  database: Database,
  lock: Shield,
  palette: Brush,
}

function getFallbackService(slug: string): ServiceRecord | null {
  const fallback = defaultServices.find((service) => service.slug === slug && service.is_published)
  if (!fallback) {
    return null
  }

  return {
    id: `default-${fallback.slug}`,
    name_es: fallback.name_es,
    name_en: fallback.name_en,
    name_pt: fallback.name_pt,
    description_es: fallback.description_es,
    description_en: fallback.description_en,
    description_pt: fallback.description_pt,
    icon: fallback.icon,
    features: fallback.features,
    is_published: fallback.is_published,
    is_featured: fallback.is_featured,
    display_order: fallback.display_order,
    slug: fallback.slug,
    hero_title: fallback.hero_title,
    hero_description: fallback.hero_description,
    detail_content: fallback.detail_content,
    process_steps: fallback.process_steps,
    deliverables: fallback.deliverables,
    use_cases: fallback.use_cases,
  }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let row: ServiceRecord | null = null

  try {
    row = await querySingle<ServiceRecord>(
      "SELECT * FROM services WHERE slug = ? AND is_published = 1 LIMIT 1",
      [slug],
    )
  } catch (error) {
    console.error(`Error loading service ${slug}:`, error)
  }

  if (!row) {
    row = getFallbackService(slug)
  }

  if (!row) {
    notFound()
  }

  const service = normalizeService(row)
  const Icon = iconLookup[service.icon as keyof typeof iconLookup] || Sparkles

  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      <PageViewTracker path={`/servicios/${service.slug}`} />
      <Header />

      <section className="relative overflow-hidden border-b border-border/50 pt-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1d4ed830,transparent_45%),linear-gradient(180deg,rgba(10,10,12,0.98),rgba(10,10,12,0.94))]" />
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute -left-16 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <Link
            href="/#servicios"
            className="mb-10 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a la pagina principal
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-primary">
                <Icon className="h-6 w-6" />
                <span className="text-sm font-semibold uppercase tracking-[0.25em]">Olbrox Tech</span>
              </div>

              <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
                {service.hero_title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
                {service.hero_description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {service.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/#contacto"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-4 font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  Solicitar cotizacion
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/#servicios"
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card/70 px-6 py-4 font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  Explorar mas servicios
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-[2rem] bg-primary/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card/60 p-8 backdrop-blur-md">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <Icon className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold">Que incluye esta solucion</h2>
                <div className="mt-6 space-y-4">
                  {service.deliverables.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/40 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <p className="leading-7 text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="rounded-[2rem] border border-border/60 bg-card/40 p-8 backdrop-blur-sm">
            <div className="mb-5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              Vision general
            </div>
            <h2 className="text-3xl font-bold">Una solucion pensada para comunicar valor y generar resultados</h2>
            <p className="mt-6 whitespace-pre-line text-lg leading-8 text-muted-foreground">{service.detail_content}</p>
          </div>

          <div className="rounded-[2rem] border border-border/60 bg-card/40 p-8 backdrop-blur-sm">
            <div className="mb-5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              Proceso de trabajo
            </div>
            <div className="space-y-4">
              {service.process_steps.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-2xl border border-border/60 bg-background/30 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">Paso {index + 1}</p>
                    <p className="mt-1 leading-7 text-muted-foreground">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden pb-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-[2rem] border border-border/60 bg-card/40 p-8 backdrop-blur-sm">
            <div className="mb-5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              Entregables
            </div>
            <div className="space-y-3">
              {service.deliverables.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/30 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="leading-7 text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/60 bg-card/40 p-8 backdrop-blur-sm">
            <div className="mb-5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              Casos de uso
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {service.use_cases.map((item) => (
                <div key={item} className="rounded-2xl border border-border/60 bg-background/30 p-4">
                  <p className="font-semibold">{item}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Aplicacion ideal para equipos o negocios que necesitan una solucion clara, profesional y escalable.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Contact />
      <Footer />
      <WhatsAppButton />
    </main>
  )
}

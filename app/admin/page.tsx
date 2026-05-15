"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  FileCog,
  FolderKanban,
  Globe2,
  Layers,
  MessageSquare,
  Monitor,
  MousePointerClick,
  ReceiptText,
  Timer,
  Users,
} from "lucide-react"

type DashboardPayload = {
  summary: {
    totalPageviews: number
    totalSessions: number
    currentVisitors: number
    engagedSessions: number
    engagementRate: number
    bounceRate: number
    pagesPerSession: number
    averageVisitDuration: number
    pageviewGrowth: number
    mobileShare: number
    countriesTracked: number
    leads30: number
    forms30: number
    whatsapp30: number
    leadConversionRate: number
    quoteAcceptanceRate: number
    acceptedRevenue: number
    pendingFollowups: number
    overdueFollowups: number
    meetingsToday: number
    contentHealthScore: number
  }
  traffic: {
    pageviews30: Array<{ day: string; total: number }>
    sessions30: Array<{ day: string; total: number }>
  }
  devices: Array<{ label: string; total: number }>
  topPages: Array<{ page: string; pageviews: number; sessions: number; avgDuration: number }>
  topCountries: Array<{ country: string; total: number }>
  topSources: Array<{ source: string; total: number }>
  funnel: {
    visits30: number
    forms30: number
    leads30: number
    qualifiedLeads: number
    proposalLeads: number
    wonLeads: number
  }
  sales: {
    acceptedQuotes: number
    viewedQuotes: number
    sentQuotes: number
    acceptedRevenue: number
  }
  operations: {
    unhandledForms: number
    whatsappOpen: number
    whatsappConverted: number
    pendingFollowups: number
    overdueFollowups: number
    meetingsToday: number
    meetingsUpcoming: number
  }
  content: {
    blocks: number
    blocksPublished: number
    services: number
    servicesPublished: number
    servicesFeatured: number
    projects: number
    projectsPublished: number
    projectsFeatured: number
    faq: number
    faqPublished: number
    media: number
  }
  health: {
    missingBlocks: string[]
    emptyCollections: string[]
  }
  recentUpdates: Array<{ id: string; title: string; type: string; updated_at: string }>
  alerts: string[]
}

const quickLinks = [
  { href: "/admin/analytics", title: "Analitica", description: "Detalle de trafico", icon: BarChart3 },
  { href: "/admin/leads", title: "Leads", description: "Embudo comercial", icon: Users },
  { href: "/admin/quotations", title: "Cotizaciones", description: "Propuestas y cierre", icon: ReceiptText },
  { href: "/admin/content", title: "Contenido", description: "Bloques del sitio", icon: Layers },
  { href: "/admin/projects", title: "Proyectos", description: "Portafolio visible", icon: FolderKanban },
  { href: "/admin/settings", title: "Configuracion", description: "Contacto y marca", icon: FileCog },
]

const deviceLabels: Record<string, string> = {
  desktop: "Escritorio",
  mobile: "Movil",
  tablet: "Tablet",
  unknown: "Otro",
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("es-EC", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDuration(seconds: number) {
  if (seconds <= 0) return "0 s"
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes} min ${rest}s`
}

function formatSource(source: string) {
  return source === "direct" ? "Directo" : source
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function SimpleBars({
  data,
  title,
  legend,
}: {
  data: Array<{ day: string; total: number }>
  title: string
  legend: string
}) {
  const total = data.reduce((sum, item) => sum + item.total, 0)
  const max = Math.max(...data.map((item) => item.total), 1)

  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{legend}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            Todavia no hay datos suficientes para este grafico.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold">{formatCompact(total)}</p>
                <p className="text-sm text-muted-foreground">acumulado en los ultimos 30 dias</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 px-4 py-2 text-right">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Promedio</p>
                <p className="text-lg font-semibold">{Math.round(total / data.length)}</p>
              </div>
            </div>

            <div className="flex h-[220px] items-end gap-2 rounded-2xl border border-border bg-background/60 p-4">
              {data.map((item) => {
                const height = Math.max((item.total / max) * 100, item.total > 0 ? 8 : 2)
                return (
                  <div key={item.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex h-[160px] w-full items-end rounded-xl bg-muted/20 p-1">
                      <div
                        className="w-full rounded-lg bg-[linear-gradient(180deg,rgba(56,189,248,0.95),rgba(37,99,235,0.92))]"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">{item.day.slice(5)}</p>
                      <p className="text-[11px] font-medium">{item.total}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RankedList({
  items,
  metricLabel,
}: {
  items: Array<{ label: string; value: number; extra?: string }>
  metricLabel: string
}) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
        Aun no hay suficientes registros para este ranking.
      </div>
    )
  }

  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.extra || metricLabel}</p>
            </div>
            <span className="text-sm text-muted-foreground">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-muted/40">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.95),rgba(59,130,246,0.95))]"
              style={{ width: `${Math.max((item.value / max) * 100, 6)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function FunnelCard({
  label,
  value,
  percent,
}: {
  label: string
  value: number
  percent: number
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{percent}%</p>
      </div>
      <p className="mt-2 text-3xl font-semibold">{formatCompact(value)}</p>
      <div className="mt-4 h-2 rounded-full bg-muted/40">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(16,185,129,0.95),rgba(59,130,246,0.95))]"
          style={{ width: `${Math.max(percent, value > 0 ? 6 : 0)}%` }}
        />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardPayload | null>(null)

  useEffect(() => {
    void fetchDashboard()
  }, [])

  async function fetchDashboard() {
    setLoading(true)

    try {
      await fetch("/api/admin/site/bootstrap", {
        method: "POST",
        credentials: "include",
      })

      const response = await fetch("/api/admin/dashboard", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("No se pudo cargar el dashboard")
      }

      setData((await response.json()) as DashboardPayload)
    } catch (error) {
      console.error("Error fetching admin dashboard:", error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const deviceSummary = useMemo(
    () =>
      data?.devices.map((item) => ({
        label: deviceLabels[item.label] || deviceLabels.unknown,
        value: item.total,
      })) || [],
    [data],
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-[420px] rounded-2xl" />
          <Skeleton className="h-[420px] rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No se pudo cargar el dashboard</CardTitle>
          <CardDescription>Revisa la conexion a la base de datos e intenta nuevamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchDashboard}>Reintentar</Button>
        </CardContent>
      </Card>
    )
  }

  const { summary, traffic, topPages, topCountries, topSources, funnel, sales, operations, content, health, recentUpdates, alerts } = data
  const growthText =
    summary.pageviewGrowth > 0
      ? `+${summary.pageviewGrowth}% frente a los 14 dias previos`
      : `${summary.pageviewGrowth}% frente a los 14 dias previos`
  const funnelBase = Math.max(funnel.visits30, 1)
  const funnelItems = [
    { label: "Visitas", value: funnel.visits30, percent: 100 },
    { label: "Formularios", value: funnel.forms30, percent: Math.round((funnel.forms30 / funnelBase) * 100) },
    { label: "Leads", value: funnel.leads30, percent: Math.round((funnel.leads30 / funnelBase) * 100) },
    { label: "Calificados", value: funnel.qualifiedLeads, percent: Math.round((funnel.qualifiedLeads / funnelBase) * 100) },
    { label: "Ganados", value: funnel.wonLeads, percent: Math.round((funnel.wonLeads / funnelBase) * 100) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Dashboard ejecutivo</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Panel basado en metricas de analitica reales tipo GA4/Plausible: sesiones, pageviews, engagement, rebote, paginas por sesion, adquisicion, conversion y operacion comercial.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/" target="_blank">
              Ver sitio publicado
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/analytics">Ver analitica completa</Link>
          </Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert} className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Pageviews"
          value={formatCompact(summary.totalPageviews)}
          description={growthText}
          icon={Eye}
        />
        <MetricCard
          title="Sesiones"
          value={formatCompact(summary.totalSessions)}
          description={`${summary.currentVisitors} visitantes activos en los ultimos 5 minutos.`}
          icon={Activity}
        />
        <MetricCard
          title="Engagement"
          value={`${summary.engagementRate}%`}
          description={`${summary.engagedSessions} sesiones con interaccion significativa.`}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Bounce Rate"
          value={`${summary.bounceRate}%`}
          description="Sesion sin interaccion relevante segun criterio de GA4."
          icon={MousePointerClick}
        />
        <MetricCard
          title="Pages / Session"
          value={String(summary.pagesPerSession)}
          description={formatDuration(summary.averageVisitDuration)}
          icon={Timer}
        />
        <MetricCard
          title="Conversion a lead"
          value={`${summary.leadConversionRate}%`}
          description={`${summary.leads30} leads creados en 30 dias.`}
          icon={Users}
        />
        <MetricCard
          title="WhatsApp"
          value={formatCompact(summary.whatsapp30)}
          description={`${operations.whatsappConverted} conversaciones convertidas.`}
          icon={MessageSquare}
        />
        <MetricCard
          title="Reuniones hoy"
          value={formatCompact(summary.meetingsToday)}
          description={`${operations.meetingsUpcoming} proximas agendadas.`}
          icon={Clock3}
        />
        <MetricCard
          title="Pipeline"
          value={formatCompact(summary.pendingFollowups)}
          description={`${summary.overdueFollowups} seguimientos vencidos.`}
          icon={BarChart3}
        />
        <MetricCard
          title="Ingreso aceptado"
          value={formatCurrency(summary.acceptedRevenue)}
          description={`${summary.quoteAcceptanceRate}% de aceptacion en cotizaciones vistas/enviadas.`}
          icon={ReceiptText}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SimpleBars
          data={traffic.pageviews30}
          title="Pageviews ultimos 30 dias"
          legend="El estandar de dashboards profesionales arranca por volumen de trafico y su tendencia."
        />
        <SimpleBars
          data={traffic.sessions30}
          title="Sesiones ultimos 30 dias"
          legend="Separar pageviews de sesiones ayuda a leer mejor calidad y profundidad de navegacion."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Embudo comercial</CardTitle>
            <CardDescription>De trafico a oportunidad en la ventana operativa de 30 dias.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {funnelItems.map((item) => (
              <FunnelCard key={item.label} label={item.label} value={item.value} percent={item.percent} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Adquisicion</CardTitle>
            <CardDescription>Fuentes y geografias que si estan trayendo trafico medible.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Paises</p>
              </div>
              <RankedList
                items={topCountries.map((item) => ({
                  label: item.country,
                  value: item.total,
                  extra: "Visitas geolocalizadas",
                }))}
                metricLabel="Visitas"
              />
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Fuentes</p>
              </div>
              <RankedList
                items={topSources.map((item) => ({
                  label: formatSource(item.source),
                  value: item.total,
                  extra: "Sesiones atribuidas",
                }))}
                metricLabel="Sesiones"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Operacion</CardTitle>
            <CardDescription>Lo que necesita accion inmediata del equipo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Formularios sin gestionar</p>
              <p className="mt-2 text-3xl font-semibold">{operations.unhandledForms}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">WhatsApp abierto</p>
              <p className="mt-2 text-3xl font-semibold">{operations.whatsappOpen}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Seguimientos pendientes</p>
              <p className="mt-2 text-3xl font-semibold">{operations.pendingFollowups}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Seguimientos vencidos</p>
              <p className="mt-2 text-3xl font-semibold">{operations.overdueFollowups}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Top paginas</CardTitle>
            <CardDescription>Los dashboards web profesionales comparan volumen, sesiones y tiempo por pagina.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPages.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                Aun no hay suficiente trafico para rankear paginas.
              </div>
            ) : (
              topPages.map((page) => (
                <div key={page.page} className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{page.page}</p>
                      <p className="text-sm text-muted-foreground">
                        {page.sessions} sesiones · {formatDuration(page.avgDuration)} promedio
                      </p>
                    </div>
                    <p className="shrink-0 text-sm text-muted-foreground">{page.pageviews} views</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Comportamiento de audiencia</CardTitle>
            <CardDescription>Distribucion por dispositivo y lectura resumida del sitio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RankedList
              items={deviceSummary.map((item) => ({
                label: item.label,
                value: item.value,
                extra: "Sesiones registradas",
              }))}
              metricLabel="Sesiones"
            />
            <div className="rounded-2xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
              {summary.mobileShare}% del trafico registrado llega desde movil o tablet. {summary.countriesTracked} paises tienen trafico identificado y la salud editorial del sitio se encuentra en {summary.contentHealthScore}%.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Caja comercial</CardTitle>
            <CardDescription>Lectura rapida del estado de cotizaciones e ingreso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Cotizaciones enviadas</p>
              <p className="mt-2 text-3xl font-semibold">{sales.sentQuotes}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Cotizaciones vistas</p>
              <p className="mt-2 text-3xl font-semibold">{sales.viewedQuotes}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Cotizaciones aceptadas</p>
              <p className="mt-2 text-3xl font-semibold">{sales.acceptedQuotes}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Estado del sitio</CardTitle>
            <CardDescription>Contenido publicado, colecciones y activos operativos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              {content.blocksPublished}/{content.blocks} bloques, {content.servicesPublished}/{content.services} servicios y {content.projectsPublished}/{content.projects} proyectos publicados.
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              {content.servicesFeatured} servicios destacados, {content.projectsFeatured} proyectos destacados, {content.faqPublished} FAQ publicadas y {content.media} activos multimedia.
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              {health.missingBlocks.length === 0
                ? "Hero, about y CTA estan presentes y publicados."
                : `Bloques base pendientes: ${health.missingBlocks.join(", ")}.`}
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              {health.emptyCollections.length === 0
                ? "Las colecciones clave tienen contenido cargado."
                : `Colecciones vacias: ${health.emptyCollections.join(", ")}.`}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Accesos rapidos</CardTitle>
            <CardDescription>Flujos de trabajo que normalmente se usan desde este panel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-2xl border border-border bg-background/60 p-4 transition-colors hover:bg-background"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/70">
        <CardHeader>
          <CardTitle>Ultimas actualizaciones</CardTitle>
          <CardDescription>Cambios recientes registrados en contenido, servicios y proyectos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 xl:grid-cols-2">
          {recentUpdates.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
              Aun no hay cambios recientes registrados.
            </div>
          ) : (
            recentUpdates.map((item) => (
              <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.type}</p>
                  </div>
                  <p className="shrink-0 text-sm text-muted-foreground">{new Date(item.updated_at).toLocaleString("es-EC")}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Eye,
  FileCheck,
  FileCog,
  FolderKanban,
  Globe2,
  LayoutPanelTop,
  Layers,
  MessageSquare,
  MousePointerClick,
  Radar,
  ReceiptText,
  Timer,
  Users,
} from "lucide-react"

type DashboardPayload = {
  summary: {
    contentBlocks: number
    contentBlocksPublished: number
    services: number
    servicesPublished: number
    servicesFeatured: number
    projects: number
    projectsPublished: number
    projectsFeatured: number
    faq: number
    faqPublished: number
    media: number
    totalVisits: number
    uniqueSessions: number
    avgVisitDuration: number
    trafficGrowth: number
    contentHealthScore: number
    countryCoverage: number
    mobileShare: number
    leads30: number
    forms30: number
    whatsapp30: number
    leadConversionRate: number
    quoteAcceptanceRate: number
    acceptedRevenue: number
    pipelineOpen: number
  }
  trends: Array<{ day: string; visits: number }>
  devices: Array<{ label: string; total: number }>
  countries: Array<{ country: string; total: number }>
  sources: Array<{ source: string; total: number }>
  topPages: Array<{ page: string; total: number }>
  insights: {
    topCountry: { country: string; total: number } | null
    topSource: { source: string; total: number } | null
    topPage: { page: string; total: number } | null
    busiestLeadStage: { label: string; total: number }
  }
  funnel: {
    visits30: number
    forms30: number
    leads30: number
    qualifiedLeads: number
    proposalLeads: number
    wonLeads: number
  }
  sales: {
    quotesAccepted: number
    quotesViewed: number
    quotesSent: number
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
  recentUpdates: Array<{ id: string; title: string; type: string; updated_at: string }>
  alerts: string[]
  health: {
    missingBlocks: string[]
    emptyCollections: string[]
  }
}

const quickLinks = [
  {
    href: "/admin/content",
    title: "Contenido",
    description: "Hero, nosotros y CTA",
    icon: Layers,
  },
  {
    href: "/admin/services",
    title: "Servicios",
    description: "Oferta comercial",
    icon: Briefcase,
  },
  {
    href: "/admin/projects",
    title: "Proyectos",
    description: "Portafolio publicado",
    icon: FolderKanban,
  },
  {
    href: "/admin/leads",
    title: "Leads",
    description: "Embudo comercial",
    icon: Users,
  },
]

const deviceColors: Record<string, string> = {
  desktop: "#3b82f6",
  mobile: "#10b981",
  tablet: "#f59e0b",
  unknown: "#64748b",
}

function formatCompactNumber(value: number) {
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
  const remainingSeconds = seconds % 60
  return `${minutes} min ${remainingSeconds}s`
}

function formatDeviceLabel(label: string) {
  if (label === "desktop") return "Escritorio"
  if (label === "mobile") return "Movil"
  if (label === "tablet") return "Tablet"
  return "Otro"
}

function formatSourceLabel(label: string) {
  if (label === "directo") return "Directo"
  return label
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
}) {
  return (
    <Card className="border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.94))] shadow-[0_24px_80px_rgba(2,6,23,0.4)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-300">{title}</CardTitle>
          <div className={`rounded-xl border border-white/10 p-2 ${accent}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight text-white">{value}</div>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </CardContent>
    </Card>
  )
}

function DeviceDonut({ devices }: { devices: Array<{ label: string; total: number }> }) {
  const total = devices.reduce((sum, item) => sum + item.total, 0)
  const radius = 68
  const circumference = 2 * Math.PI * radius
  let offset = 0

  if (total === 0) {
    return <EmptyState text="Todavia no hay sesiones suficientes para distribuir por dispositivo." />
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-[220px] w-[220px]">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="20" />
          {devices.map((device) => {
            const fraction = total > 0 ? device.total / total : 0
            const length = circumference * fraction
            const circle = (
              <circle
                key={device.label}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={deviceColors[device.label] || deviceColors.unknown}
                strokeWidth="20"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            )
            offset += length
            return circle
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white">{total}</span>
          <span className="text-xs uppercase tracking-[0.35em] text-slate-400">sesiones</span>
        </div>
      </div>

      <div className="w-full space-y-2">
        {devices.map((device) => (
          <div key={device.label} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: deviceColors[device.label] || deviceColors.unknown }}
              />
              <span className="text-slate-200">{formatDeviceLabel(device.label)}</span>
            </div>
            <span className="text-slate-400">{device.total}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrafficBars({ trends }: { trends: Array<{ day: string; visits: number }> }) {
  const max = Math.max(...trends.map((item) => item.visits), 1)
  const total = trends.reduce((sum, item) => sum + item.visits, 0)

  if (total === 0) {
    return <EmptyState text="Todavia no hay trafico registrado en los ultimos 14 dias." />
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-4xl font-semibold text-white">{formatCompactNumber(total)}</p>
          <p className="text-sm text-slate-400">visitas registradas en la ventana reciente</p>
        </div>
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Ritmo</p>
          <p className="text-lg font-semibold text-white">{Math.round(total / trends.length)} por dia</p>
        </div>
      </div>

      <div className="flex h-[260px] items-end gap-3 rounded-3xl border border-white/8 bg-white/[0.02] p-5">
        {trends.map((point) => {
          const height = Math.max((point.visits / max) * 100, point.visits > 0 ? 12 : 4)
          return (
            <div key={point.day} className="flex min-w-0 flex-1 flex-col items-center gap-3">
              <div className="flex h-[180px] w-full items-end rounded-2xl bg-slate-950/50 p-1">
                <div
                  className="w-full rounded-xl bg-[linear-gradient(180deg,rgba(56,189,248,0.95),rgba(37,99,235,0.9))] shadow-[0_12px_40px_rgba(37,99,235,0.28)]"
                  style={{ height: `${height}%` }}
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">{point.day.slice(5)}</p>
                <p className="text-xs font-semibold text-slate-200">{point.visits}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MiniList({
  items,
  valueLabel,
}: {
  items: Array<{ label: string; value: number }>
  valueLabel: string
}) {
  if (items.length === 0) {
    return <EmptyState text="Aun no hay datos suficientes para este ranking." />
  }

  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{item.label}</p>
              <p className="text-sm text-slate-400">{valueLabel}</p>
            </div>
            <span className="text-sm text-slate-300">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-900">
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

function FunnelColumn({
  label,
  value,
  percent,
}: {
  label: string
  value: number
  percent: number
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-300">{label}</p>
        <p className="text-xs text-slate-500">{percent}%</p>
      </div>
      <p className="mt-2 text-3xl font-semibold text-white">{formatCompactNumber(value)}</p>
      <div className="mt-4 h-2 rounded-full bg-slate-900">
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

      const payload = (await response.json()) as DashboardPayload
      setData(payload)
    } catch (error) {
      console.error("Error fetching admin dashboard:", error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(8)].map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-[24px]" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <Skeleton className="h-[420px] rounded-[28px]" />
          <Skeleton className="h-[420px] rounded-[28px]" />
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

  const { summary, trends, devices, countries, sources, topPages, insights, funnel, sales, operations, recentUpdates, alerts, health } = data
  const leadBase = Math.max(funnel.visits30, 1)
  const funnelItems = [
    { label: "Visitas 30 dias", value: funnel.visits30, percent: 100 },
    { label: "Formularios", value: funnel.forms30, percent: Math.round((funnel.forms30 / leadBase) * 100) },
    { label: "Leads", value: funnel.leads30, percent: Math.round((funnel.leads30 / leadBase) * 100) },
    { label: "Calificados", value: funnel.qualifiedLeads, percent: Math.round((funnel.qualifiedLeads / leadBase) * 100) },
    { label: "Ganados", value: funnel.wonLeads, percent: Math.round((funnel.wonLeads / leadBase) * 100) },
  ]

  const topPageItems = topPages.map((item) => ({ label: item.page, value: item.total }))
  const countryItems = countries.map((item) => ({ label: item.country, value: item.total }))
  const sourceItems = sources.map((item) => ({ label: formatSourceLabel(item.source), value: item.total }))

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.22),_transparent_24%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.92))] p-6 shadow-[0_24px_120px_rgba(2,6,23,0.45)]">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.12),_transparent_60%)] lg:block" />
        <div className="relative grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-cyan-100">
              <LayoutPanelTop className="h-3.5 w-3.5" />
              Centro de control
            </div>
            <div>
              <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                Dashboard ejecutivo con trafico, captacion y operacion del sitio en una sola vista.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Este panel combina analitica web, formularios, WhatsApp, cotizaciones y seguimiento comercial para leer el negocio con datos reales y no solo contenido publicado.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Trafico 14d</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatCompactNumber(trends.reduce((sum, item) => sum + item.visits, 0))}</p>
                <p className="mt-2 text-sm text-slate-400">{summary.trafficGrowth >= 0 ? `+${summary.trafficGrowth}% vs periodo anterior` : `${summary.trafficGrowth}% vs periodo anterior`}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Conversion lead</p>
                <p className="mt-2 text-3xl font-semibold text-white">{summary.leadConversionRate}%</p>
                <p className="mt-2 text-sm text-slate-400">{summary.leads30} leads creados en 30 dias.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Ingreso aceptado</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatCurrency(summary.acceptedRevenue)}</p>
                <p className="mt-2 text-sm text-slate-400">{sales.quotesAccepted} cotizaciones aceptadas.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-200">Lectura rapida</p>
                <Radar className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>{summary.mobileShare}% del trafico llega desde movil o tablet.</p>
                <p>{insights.topCountry ? `${insights.topCountry.country} lidera la audiencia conocida con ${insights.topCountry.total} visitas.` : "Todavia no hay paises identificados en las visitas historicas."}</p>
                <p>{insights.topSource ? `${formatSourceLabel(insights.topSource.source)} es la principal fuente registrada.` : "Aun no hay una fuente de adquisicion dominante."}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="min-w-[180px]">
                <Link href="/" target="_blank">
                  Ver sitio publicado
                </Link>
              </Button>
              <Button asChild variant="outline" className="min-w-[180px] border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]">
                <Link href="/admin/analytics">
                  Ver analitica completa
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {alerts.length > 0 && (
        <section className="grid gap-3">
          {alerts.map((alert) => (
            <div key={alert} className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{alert}</span>
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Sesiones unicas"
          value={formatCompactNumber(summary.uniqueSessions)}
          description="Huella estimada de usuarios distintos registrados en analitica."
          icon={Activity}
          accent="bg-blue-500/70"
        />
        <MetricCard
          title="Tiempo medio"
          value={formatDuration(summary.avgVisitDuration)}
          description="Permanencia promedio real medida por evento de salida."
          icon={Timer}
          accent="bg-cyan-500/70"
        />
        <MetricCard
          title="Formularios 30 dias"
          value={formatCompactNumber(summary.forms30)}
          description={`${operations.unhandledForms} pendientes de gestion comercial.`}
          icon={MousePointerClick}
          accent="bg-emerald-500/70"
        />
        <MetricCard
          title="WhatsApp 30 dias"
          value={formatCompactNumber(summary.whatsapp30)}
          description={`${operations.whatsappConverted} conversaciones ya convertidas.`}
          icon={MessageSquare}
          accent="bg-green-500/70"
        />
        <MetricCard
          title="Embudo abierto"
          value={formatCompactNumber(summary.pipelineOpen)}
          description="Seguimientos y reuniones activas por atender."
          icon={Briefcase}
          accent="bg-violet-500/70"
        />
        <MetricCard
          title="Aceptacion cotizaciones"
          value={`${summary.quoteAcceptanceRate}%`}
          description={`${sales.quotesViewed} vistas y ${sales.quotesSent} enviadas activas.`}
          icon={ReceiptText}
          accent="bg-fuchsia-500/70"
        />
        <MetricCard
          title="Paises identificados"
          value={formatCompactNumber(summary.countryCoverage)}
          description={insights.topCountry ? `${insights.topCountry.country} es el mercado principal conocido.` : "Las nuevas visitas iran completando este mapa."}
          icon={Globe2}
          accent="bg-sky-500/70"
        />
        <MetricCard
          title="Salud editorial"
          value={`${summary.contentHealthScore}%`}
          description={`${summary.contentBlocksPublished}/${summary.contentBlocks} bloques y ${summary.projectsPublished}/${summary.projects} proyectos listos.`}
          icon={FileCheck}
          accent="bg-orange-500/70"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]">
          <CardHeader>
            <CardTitle className="text-white">Pulso del trafico</CardTitle>
            <CardDescription>Comportamiento diario de las visitas reales de los ultimos 14 dias.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrafficBars trends={trends} />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]">
          <CardHeader>
            <CardTitle className="text-white">Distribucion por dispositivo</CardTitle>
            <CardDescription>Como se reparte la audiencia entre escritorio, movil y tablet.</CardDescription>
          </CardHeader>
          <CardContent>
            <DeviceDonut devices={devices} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]">
          <CardHeader>
            <CardTitle className="text-white">Embudo comercial</CardTitle>
            <CardDescription>De trafico a negocio en la ventana operativa de 30 dias.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {funnelItems.map((item) => (
              <FunnelColumn key={item.label} label={item.label} value={item.value} percent={item.percent} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]">
          <CardHeader>
            <CardTitle className="text-white">Operacion inmediata</CardTitle>
            <CardDescription>Lo que el equipo deberia atender ahora mismo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CalendarClock className="h-4 w-4 text-blue-300" />
                Reuniones
              </div>
              <p className="mt-2 text-3xl font-semibold text-white">{operations.meetingsToday}</p>
              <p className="mt-1 text-sm text-slate-400">{operations.meetingsUpcoming} proximas agendadas.</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <BarChart3 className="h-4 w-4 text-emerald-300" />
                Seguimientos
              </div>
              <p className="mt-2 text-3xl font-semibold text-white">{operations.pendingFollowups}</p>
              <p className="mt-1 text-sm text-slate-400">{operations.overdueFollowups} vencidos requieren accion.</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <MessageSquare className="h-4 w-4 text-cyan-300" />
                WhatsApp abierto
              </div>
              <p className="mt-2 text-3xl font-semibold text-white">{operations.whatsappOpen}</p>
              <p className="mt-1 text-sm text-slate-400">Conversaciones iniciadas o respondidas sin cerrar.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]">
          <CardHeader>
            <CardTitle className="text-white">Inteligencia ejecutiva</CardTitle>
            <CardDescription>Lecturas cortas para tomar decisiones rapidas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center gap-2 font-medium text-white">
                <Eye className="h-4 w-4 text-cyan-300" />
                Pagina lider
              </div>
              <p className="text-sm text-slate-400">
                {insights.topPage ? `${insights.topPage.page} concentra ${insights.topPage.total} visitas registradas.` : "Aun no existe una pagina dominante en el historial."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center gap-2 font-medium text-white">
                <CircleDollarSign className="h-4 w-4 text-emerald-300" />
                Ingreso validado
              </div>
              <p className="text-sm text-slate-400">
                {sales.quotesAccepted > 0
                  ? `${sales.quotesAccepted} cotizaciones aceptadas ya representan ${formatCurrency(sales.acceptedRevenue)}.`
                  : "Todavia no hay cotizaciones aceptadas para medir ingreso confirmado."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center gap-2 font-medium text-white">
                <CheckCircle2 className="h-4 w-4 text-blue-300" />
                Cobertura de datos
              </div>
              <p className="text-sm text-slate-400">
                {summary.countryCoverage > 0
                  ? `Ya se identifican ${summary.countryCoverage} paises con trafico real.`
                  : "La geolocalizacion empezara a poblarse con las nuevas visitas registradas por el tracker actualizado."}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]">
          <CardHeader>
            <CardTitle className="text-white">Paginas con mas trafico</CardTitle>
            <CardDescription>URLs que estan absorbiendo la atencion del sitio.</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniList items={topPageItems} valueLabel="Visitas acumuladas" />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]">
          <CardHeader>
            <CardTitle className="text-white">Ultimas actualizaciones</CardTitle>
            <CardDescription>Cambios recientes en contenido, servicios y portafolio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUpdates.length === 0 ? (
              <EmptyState text="Aun no hay cambios recientes registrados." />
            ) : (
              recentUpdates.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{item.title}</p>
                    <p className="text-sm text-slate-400">{item.type}</p>
                  </div>
                  <p className="shrink-0 text-sm text-slate-500">{new Date(item.updated_at).toLocaleString("es-EC")}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]">
          <CardHeader>
            <CardTitle className="text-white">Origen geografico</CardTitle>
            <CardDescription>Paises con visitas identificadas de forma confiable.</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniList items={countryItems} valueLabel="Visitas geolocalizadas" />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]">
          <CardHeader>
            <CardTitle className="text-white">Fuentes de trafico</CardTitle>
            <CardDescription>Canales y dominios que estan entregando sesiones al sitio.</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniList items={sourceItems} valueLabel="Sesiones atribuidas" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]">
          <CardHeader>
            <CardTitle className="text-white">Estado del contenido</CardTitle>
            <CardDescription>Lectura operativa del CMS y del sitio publicado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-slate-300">
              Hero, about y CTA {health.missingBlocks.length === 0 ? "estan publicados y operativos." : `requieren revision: ${health.missingBlocks.join(", ")}.`}
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-slate-300">
              {health.emptyCollections.length === 0
                ? "Las colecciones clave del CMS tienen contenido cargado."
                : `Colecciones vacias detectadas: ${health.emptyCollections.join(", ")}.`}
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-slate-300">
              {summary.servicesFeatured} servicios destacados, {summary.projectsFeatured} proyectos destacados y {summary.faqPublished} FAQ publicadas.
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]">
          <CardHeader>
            <CardTitle className="text-white">Caja comercial</CardTitle>
            <CardDescription>Estado monetizable del flujo de propuestas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-sm text-slate-400">Cotizaciones aceptadas</p>
              <p className="mt-2 text-3xl font-semibold text-white">{sales.quotesAccepted}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-sm text-slate-400">Valor confirmado</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatCurrency(sales.acceptedRevenue)}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-sm text-slate-400">Cotizaciones vistas</p>
              <p className="mt-2 text-3xl font-semibold text-white">{sales.quotesViewed}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]">
          <CardHeader>
            <CardTitle className="text-white">Accesos rapidos</CardTitle>
            <CardDescription>Areas operativas clave para moverte rapido.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition-colors hover:border-cyan-400/30 hover:bg-white/[0.06]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-200">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{item.title}</p>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
              </Link>
            ))}
            <Link
              href="/admin/settings"
              className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition-colors hover:border-cyan-400/30 hover:bg-white/[0.06]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-200">
                  <FileCog className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">Configuracion</p>
                  <p className="text-sm text-slate-400">Contacto, marca y datos base</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

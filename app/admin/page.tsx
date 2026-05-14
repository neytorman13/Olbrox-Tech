"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Activity,
  ArrowRight,
  Briefcase,
  Eye,
  FileCheck,
  FileCog,
  FolderKanban,
  Globe,
  Image as ImageIcon,
  Layers,
  Timer,
  TrendingUp,
  Wrench,
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
  }
  trends: Array<{ day: string; visits: number }>
  devices: Array<{ label: string; total: number }>
  topPages: Array<{ page: string; total: number }>
  recentUpdates: Array<{ id: string; title: string; type: string; updated_at: string }>
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
    description: "Oferta comercial del sitio",
    icon: Briefcase,
  },
  {
    href: "/admin/projects",
    title: "Proyectos",
    description: "Portafolio publicado",
    icon: FolderKanban,
  },
  {
    href: "/admin/settings",
    title: "Configuracion",
    description: "Contacto y redes sociales",
    icon: FileCog,
  },
]

const deviceColors: Record<string, string> = {
  desktop: "#3b82f6",
  mobile: "#10b981",
  tablet: "#f59e0b",
  unknown: "#64748b",
}

function formatDeviceLabel(label: string) {
  if (label === "desktop") return "Escritorio"
  if (label === "mobile") return "Movil"
  if (label === "tablet") return "Tablet"
  return "Otro"
}

function DeviceDonut({ devices }: { devices: Array<{ label: string; total: number }> }) {
  const total = devices.reduce((sum, item) => sum + item.total, 0)
  const radius = 70
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-[220px] w-[220px]">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="22" />
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
                strokeWidth="22"
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
          <span className="text-4xl font-bold">{total}</span>
          <span className="text-xs uppercase tracking-[0.35em] text-muted-foreground">visitas</span>
        </div>
      </div>

      <div className="w-full space-y-2">
        {devices.map((device) => (
          <div key={device.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: deviceColors[device.label] || deviceColors.unknown }}
              />
              <span>{formatDeviceLabel(device.label)}</span>
            </div>
            <span className="text-muted-foreground">{device.total}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrafficBars({ trends }: { trends: Array<{ day: string; visits: number }> }) {
  const max = Math.max(...trends.map((item) => item.visits), 1)

  return (
    <div className="flex h-[280px] items-end gap-3 overflow-hidden">
      {trends.map((point) => {
        const height = Math.max((point.visits / max) * 100, point.visits > 0 ? 10 : 4)
        return (
          <div key={point.day} className="flex min-w-0 flex-1 flex-col items-center gap-3">
            <div className="flex h-[220px] w-full items-end">
              <div className="group relative flex h-full w-full items-end">
                <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-primary/10" style={{ height: `${height}%` }} />
                <div
                  className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-gradient-to-t from-primary to-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.18)] transition-all duration-300 group-hover:from-blue-400 group-hover:to-cyan-300"
                  style={{ height: `${height}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{point.day.slice(5)}</p>
              <p className="text-xs font-semibold">{point.visits}</p>
            </div>
          </div>
        )
      })}
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

  const trafficBars = useMemo(() => data?.trends || [], [data])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(8)].map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-[320px] w-full rounded-xl" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
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

  const { summary, devices, topPages, recentUpdates, health } = data
  const topPage = topPages[0]
  const growthText =
    summary.trafficGrowth > 0
      ? `+${summary.trafficGrowth}% vs. 14 dias anteriores`
      : `${summary.trafficGrowth}% vs. 14 dias anteriores`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Panel del sitio</h2>
          <p className="text-muted-foreground">
            Estado real del contenido publicado, trafico web y salud operativa del sitio corporativo.
          </p>
        </div>
        <Button asChild>
          <Link href="/" target="_blank">
            Ver sitio publicado
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Salud editorial</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.contentHealthScore}%</div>
            <p className="text-xs text-muted-foreground">Bloques clave, servicios y proyectos con datos reales.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Visitas totales</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.totalVisits}</div>
            <p className="text-xs text-muted-foreground">{growthText}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Sesiones unicas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.uniqueSessions}</div>
            <p className="text-xs text-muted-foreground">Estimacion por sesion o huella de visita.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Duracion promedio</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.avgVisitDuration}s</div>
            <p className="text-xs text-muted-foreground">Tiempo medio de permanencia registrado.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Contenido</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {summary.contentBlocksPublished}/{summary.contentBlocks}
            </div>
            <p className="text-xs text-muted-foreground">Bloques publicados frente al total.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Servicios</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {summary.servicesPublished}/{summary.services}
            </div>
            <p className="text-xs text-muted-foreground">{summary.servicesFeatured} destacados.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Proyectos</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {summary.projectsPublished}/{summary.projects}
            </div>
            <p className="text-xs text-muted-foreground">{summary.projectsFeatured} destacados.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Activos</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.media}</div>
            <p className="text-xs text-muted-foreground">{summary.faqPublished} FAQ publicadas.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Trafico de los ultimos 14 dias</CardTitle>
            <CardDescription>Crecimiento y comportamiento reciente del sitio.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <TrafficBars trends={trafficBars} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribucion por dispositivo</CardTitle>
            <CardDescription>De donde llega el trafico medido.</CardDescription>
          </CardHeader>
          <CardContent>
            <DeviceDonut devices={devices} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Inteligencia del sitio</CardTitle>
            <CardDescription>Lecturas utiles para tomar decisiones de contenido.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <TrendingUp className="h-4 w-4 text-primary" />
                Trafico
              </div>
              <p className="text-sm text-muted-foreground">
                {summary.trafficGrowth >= 0
                  ? `El trafico reciente crecio ${summary.trafficGrowth}% frente al periodo anterior.`
                  : `El trafico reciente cayo ${Math.abs(summary.trafficGrowth)}% frente al periodo anterior.`}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <Globe className="h-4 w-4 text-primary" />
                Pagina mas visitada
              </div>
              <p className="text-sm text-muted-foreground">
                {topPage ? `${topPage.page} acumula ${topPage.total} visitas registradas.` : "Aun no hay paginas registradas."}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <Wrench className="h-4 w-4 text-primary" />
                Publicacion
              </div>
              <p className="text-sm text-muted-foreground">
                {summary.servicesPublished} servicios y {summary.projectsPublished} proyectos ya estan visibles al publico.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del contenido</CardTitle>
            <CardDescription>Bloques criticos y colecciones faltantes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {health.missingBlocks.length === 0 ? (
              <div className="rounded-xl border border-border bg-card/50 p-4 text-sm text-muted-foreground">
                Hero, about y CTA estan presentes y publicados.
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                Faltan bloques base: {health.missingBlocks.join(", ")}
              </div>
            )}

            {health.emptyCollections.length === 0 ? (
              <div className="rounded-xl border border-border bg-card/50 p-4 text-sm text-muted-foreground">
                Las colecciones clave del CMS ya tienen contenido cargado.
              </div>
            ) : (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                Colecciones vacias: {health.emptyCollections.join(", ")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accesos rapidos</CardTitle>
            <CardDescription>Las areas operativas que si importan en esta web.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-primary/40 hover:bg-card"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Paginas con mas trafico</CardTitle>
            <CardDescription>Top de URLs segun `page_analytics`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Aun no hay visitas suficientes para construir este ranking.
              </div>
            ) : (
              topPages.map((page) => (
                <div
                  key={page.page}
                  className="flex items-center justify-between rounded-xl border border-border bg-card/50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{page.page}</p>
                    <p className="text-sm text-muted-foreground">Visitas acumuladas</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{page.total}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultimas actualizaciones</CardTitle>
            <CardDescription>Cambios recientes en contenido, servicios y portafolio.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentUpdates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Aun no hay cambios recientes registrados.
              </div>
            ) : (
              <div className="space-y-3">
                {recentUpdates.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-card/50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.type}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{new Date(item.updated_at).toLocaleString("es-EC")}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

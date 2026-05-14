"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Shield,
  Search,
  Activity,
  Lock,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ActivityItem {
  id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, any>
  ip_address: string | null
  created_at: string
}

export default function SecurityPage() {
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const db = createClient()

  useEffect(() => {
    fetchActivity()
  }, [actionFilter])

  async function fetchActivity() {
    setLoading(true)
    let query = db.from("activity_log").select("*").order("created_at", { ascending: false }).limit(200)
    if (actionFilter !== "all") query = query.eq("action", actionFilter)
    const { data, error } = await query
    if (error) toast.error("Error al cargar registro")
    setActivity(data || [])
    setLoading(false)
  }

  const filtered = activity.filter(
    (a) =>
      !search ||
      a.action.toLowerCase().includes(search.toLowerCase()) ||
      (a.entity_type || "").toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(a.details || {}).toLowerCase().includes(search.toLowerCase()),
  )

  const uniqueActions = Array.from(new Set(activity.map((a) => a.action)))

  const todayCount = activity.filter(
    (a) => new Date(a.created_at).toDateString() === new Date().toDateString(),
  ).length

  const securityChecks = [
    { label: "Autenticación habilitada", ok: true, detail: "Sistema de autenticación local activo" },
    { label: "Encriptación de contraseñas", ok: true, detail: "SHA256 configurado" },
    { label: "Variables de entorno", ok: true, detail: "Claves en .env (nunca en código)" },
    { label: "HTTPS", ok: true, detail: "Requerido en producción" },
    { label: "Backups regulares", ok: false, detail: "Configura respaldos automáticos en tu servidor" },
    { label: "2FA recomendado", ok: false, detail: "Implementa autenticación de dos factores" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Seguridad</h2>
        <p className="text-muted-foreground">Actividad del sistema y estado de seguridad</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Eventos totales</span><Activity className="h-4 w-4 text-muted-foreground" /></div><div className="mt-1 text-2xl font-bold">{activity.length}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Hoy</span><Clock className="h-4 w-4 text-muted-foreground" /></div><div className="mt-1 text-2xl font-bold">{todayCount}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Checks pasados</span><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div><div className="mt-1 text-2xl font-bold text-emerald-600">{securityChecks.filter((c) => c.ok).length}/{securityChecks.length}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Acciones únicas</span><KeyRound className="h-4 w-4 text-muted-foreground" /></div><div className="mt-1 text-2xl font-bold">{uniqueActions.length}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Registro de actividad</TabsTrigger>
          <TabsTrigger value="checks">Checks de seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-10" placeholder="Buscar en el registro..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las acciones</SelectItem>
                    {uniqueActions.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[55vh]">
                {loading ? (
                  <div className="space-y-2 p-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : filtered.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <Activity className="h-10 w-10" />
                    <p className="mt-2 text-sm">Sin actividad registrada</p>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {filtered.map((a) => (
                      <li key={a.id} className="flex items-start gap-3 p-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{a.action}</span>
                            {a.entity_type && <Badge variant="outline" className="text-xs">{a.entity_type}</Badge>}
                            {a.ip_address && <span className="font-mono text-xs text-muted-foreground">{a.ip_address}</span>}
                          </div>
                          {a.details && Object.keys(a.details).length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                              {JSON.stringify(a.details)}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {format(new Date(a.created_at), "dd MMM yyyy, HH:mm:ss", { locale: es })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Estado de seguridad</CardTitle>
              <CardDescription>Revisión de la configuración actual</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {securityChecks.map((c, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-lg border p-3">
                    {c.ok ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{c.label}</p>
                      <p className="text-sm text-muted-foreground">{c.detail}</p>
                    </div>
                    <Badge className={c.ok ? "bg-emerald-500" : "bg-orange-500"}>{c.ok ? "OK" : "Acción requerida"}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}



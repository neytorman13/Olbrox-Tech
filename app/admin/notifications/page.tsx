"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Link as LinkIcon,
} from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Notification {
  id: string
  user_id: string | null
  title: string
  message: string | null
  type: "info" | "success" | "warning" | "error"
  is_read: boolean
  action_url: string | null
  created_at: string
}

const typeMeta: Record<string, { icon: any; color: string }> = {
  info: { icon: Info, color: "text-blue-500" },
  success: { icon: CheckCircle2, color: "text-emerald-500" },
  warning: { icon: AlertTriangle, color: "text-orange-500" },
  error: { icon: XCircle, color: "text-red-500" },
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const db = createClient()

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' })
      const data = await response.json()
      const authUser = data?.data?.user ?? null
      if (!response.ok || !authUser?.id) return

      const { data: notifications, error } = await db
        .from("notifications")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(200)
      if (error) toast.error("Error al cargar notificaciones")
      setItems(notifications || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  async function markRead(id: string) {
    const { error } = await db.from("notifications").update({ is_read: true }).eq("id", id)
    if (error) return
    fetchItems()
  }

  async function markAllRead() {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' })
      const data = await response.json()
      const authUser = data?.data?.user ?? null
      if (!response.ok || !authUser?.id) return

      const { error } = await db
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", authUser.id)
        .eq("is_read", false)
      if (error) return toast.error("Error")
      toast.success("Todas marcadas como leídas")
      fetchItems()
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error)
      toast.error("Error")
    }
  }

  async function remove(id: string) {
    const { error } = await db.from("notifications").delete().eq("id", id)
    if (error) return toast.error("Error")
    toast.success("Eliminada")
    fetchItems()
  }

  const filtered = items.filter((n) => {
    if (filter === "unread") return !n.is_read
    if (filter === "read") return n.is_read
    return true
  })

  const unreadCount = items.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notificaciones</h2>
          <p className="text-muted-foreground">Centro de alertas y actividad importante</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" /> Marcar todas leídas
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="cursor-pointer" onClick={() => setFilter("all")}>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter("unread")}>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sin leer</span>
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-1 text-2xl font-bold text-primary">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter("read")}>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Leídas</span>
              <BellOff className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 text-2xl font-bold">{items.length - unreadCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de notificaciones</CardTitle>
          <CardDescription>
            {filter === "all" ? "Todas" : filter === "unread" ? "Sin leer" : "Leídas"} · {filtered.length} resultados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[55vh]">
            {loading ? (
              <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                <Bell className="h-10 w-10" />
                <p className="mt-2 text-sm">Sin notificaciones</p>
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((n) => {
                  const meta = typeMeta[n.type] || typeMeta.info
                  return (
                    <li
                      key={n.id}
                      className={`flex items-start gap-3 p-4 transition-colors hover:bg-muted/50 ${!n.is_read ? "bg-primary/5" : ""}`}
                    >
                      <meta.icon className={`h-5 w-5 shrink-0 ${meta.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={!n.is_read ? "font-semibold" : "font-medium"}>{n.title}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(n.created_at), { locale: es, addSuffix: true })}
                          </span>
                        </div>
                        {n.message && <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>}
                        {n.action_url && (
                          <Link href={n.action_url} className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <LinkIcon className="h-3 w-3" /> Ver detalles
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!n.is_read && <Badge className="bg-primary">Nuevo</Badge>}
                        {!n.is_read && (
                          <Button size="icon" variant="ghost" onClick={() => markRead(n.id)} title="Marcar leída">
                            <CheckCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => remove(n.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}



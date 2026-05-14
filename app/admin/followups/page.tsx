"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Plus,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Edit,
} from "lucide-react"
import { format, isPast, isToday, isTomorrow } from "date-fns"
import { es } from "date-fns/locale"

interface Followup {
  id: string
  lead_id: string | null
  customer_id: string | null
  title: string
  description: string | null
  followup_type: string
  due_date: string
  priority: string
  status: string
  completed_at: string | null
  result: string | null
}

const typeIcons: Record<string, any> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageSquare,
  meeting: Calendar,
  task: CheckCircle2,
  other: Clock,
}
const typeLabels: Record<string, string> = {
  call: "Llamada",
  email: "Email",
  whatsapp: "WhatsApp",
  meeting: "Reunión",
  task: "Tarea",
  other: "Otro",
}
const priorityColors: Record<string, string> = {
  low: "bg-gray-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
}
const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  in_progress: "bg-blue-500",
  completed: "bg-emerald-500",
  cancelled: "bg-gray-500",
  overdue: "bg-red-500",
}
const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completado",
  cancelled: "Cancelado",
  overdue: "Vencido",
}

export default function FollowupsPage() {
  const [items, setItems] = useState<Followup[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Followup | null>(null)
  const [form, setForm] = useState<any>({
    title: "",
    description: "",
    followup_type: "call",
    due_date: new Date().toISOString().slice(0, 16),
    priority: "medium",
    status: "pending",
  })
  const db = createClient()

  useEffect(() => {
    fetchItems()
  }, [statusFilter])

  async function fetchItems() {
    setLoading(true)
    let query = db.from("followups").select("*").order("due_date", { ascending: true })
    if (statusFilter !== "all") query = query.eq("status", statusFilter)
    const { data, error } = await query
    if (error) toast.error("Error al cargar seguimientos")
    setItems(data || [])
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setForm({
      title: "",
      description: "",
      followup_type: "call",
      due_date: new Date().toISOString().slice(0, 16),
      priority: "medium",
      status: "pending",
    })
    setIsFormOpen(true)
  }

  function openEdit(f: Followup) {
    setEditing(f)
    setForm({
      ...f,
      due_date: f.due_date ? f.due_date.slice(0, 16) : "",
    })
    setIsFormOpen(true)
  }

  async function save() {
    if (!form.title) return toast.error("El título es requerido")
    const payload = {
      ...form,
      due_date: new Date(form.due_date).toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (editing) {
      const { error } = await db.from("followups").update(payload).eq("id", editing.id)
      if (error) return toast.error("Error al actualizar")
      toast.success("Seguimiento actualizado")
    } else {
      const { error } = await db.from("followups").insert(payload)
      if (error) return toast.error("Error al crear")
      toast.success("Seguimiento creado")
    }
    setIsFormOpen(false)
    fetchItems()
  }

  async function completeItem(f: Followup) {
    const { error } = await db
      .from("followups")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", f.id)
    if (error) return toast.error("Error")
    toast.success("Marcado como completado")
    fetchItems()
  }

  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar este seguimiento?")) return
    const { error } = await db.from("followups").delete().eq("id", id)
    if (error) return toast.error("Error")
    toast.success("Eliminado")
    fetchItems()
  }

  function dueLabel(date: string) {
    const d = new Date(date)
    if (isToday(d)) return "Hoy"
    if (isTomorrow(d)) return "Mañana"
    return format(d, "dd MMM, HH:mm", { locale: es })
  }

  const stats = {
    pending: items.filter((i) => i.status === "pending").length,
    overdue: items.filter((i) => i.status === "pending" && isPast(new Date(i.due_date))).length,
    today: items.filter((i) => isToday(new Date(i.due_date))).length,
    completed: items.filter((i) => i.status === "completed").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Seguimientos</h2>
          <p className="text-muted-foreground">Tareas y recordatorios comerciales</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo seguimiento
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-5"><div className="text-sm text-muted-foreground">Pendientes</div><div className="mt-1 text-2xl font-bold">{stats.pending}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="text-sm text-muted-foreground">Vencidos</div><div className="mt-1 text-2xl font-bold text-red-500">{stats.overdue}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="text-sm text-muted-foreground">Hoy</div><div className="mt-1 text-2xl font-bold">{stats.today}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="text-sm text-muted-foreground">Completados</div><div className="mt-1 text-2xl font-bold text-emerald-600">{stats.completed}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de seguimientos</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <Clock className="h-10 w-10" />
              <p className="mt-2 text-sm">No hay seguimientos</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((f) => {
                const Icon = typeIcons[f.followup_type] || Clock
                const overdue = f.status === "pending" && isPast(new Date(f.due_date))
                return (
                  <li key={f.id} className="flex items-center gap-3 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{f.title}</p>
                        <Badge className={priorityColors[f.priority]}>{f.priority}</Badge>
                        <Badge variant="outline">{typeLabels[f.followup_type]}</Badge>
                        {overdue && <Badge className="bg-red-500"><AlertTriangle className="mr-1 h-3 w-3" /> Vencido</Badge>}
                      </div>
                      {f.description && <p className="truncate text-sm text-muted-foreground">{f.description}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{dueLabel(f.due_date)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={statusColors[f.status]}>{statusLabels[f.status]}</Badge>
                      {f.status !== "completed" && (
                        <Button size="icon" variant="ghost" onClick={() => completeItem(f)} title="Completar">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => openEdit(f)}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteItem(f.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar seguimiento" : "Nuevo seguimiento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.followup_type} onValueChange={(v) => setForm({ ...form, followup_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fecha límite</Label>
              <Input
                type="datetime-local"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



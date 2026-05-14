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
  Calendar,
  Clock,
  Video,
  MapPin,
  Mail,
  Phone,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { format, isFuture, isPast, isToday } from "date-fns"
import { es } from "date-fns/locale"

interface Meeting {
  id: string
  title: string
  description: string | null
  attendee_name: string | null
  attendee_email: string | null
  attendee_phone: string | null
  meeting_link: string | null
  location: string | null
  scheduled_at: string
  duration_minutes: number
  status: string
  notes: string | null
}

const statusMeta: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Agendada", color: "bg-blue-500" },
  confirmed: { label: "Confirmada", color: "bg-emerald-500" },
  completed: { label: "Realizada", color: "bg-gray-500" },
  cancelled: { label: "Cancelada", color: "bg-red-500" },
  no_show: { label: "No asistió", color: "bg-orange-500" },
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"upcoming" | "today" | "past" | "all">("upcoming")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Meeting | null>(null)
  const [form, setForm] = useState<any>({
    title: "",
    description: "",
    attendee_name: "",
    attendee_email: "",
    attendee_phone: "",
    meeting_link: "",
    location: "",
    scheduled_at: new Date().toISOString().slice(0, 16),
    duration_minutes: 30,
    status: "scheduled",
    notes: "",
  })
  const db = createClient()

  useEffect(() => {
    fetchMeetings()
  }, [])

  async function fetchMeetings() {
    setLoading(true)
    const { data, error } = await db
      .from("meetings")
      .select("*")
      .order("scheduled_at", { ascending: true })
    if (error) toast.error("Error al cargar reuniones")
    setMeetings(data || [])
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setForm({
      title: "",
      description: "",
      attendee_name: "",
      attendee_email: "",
      attendee_phone: "",
      meeting_link: "",
      location: "",
      scheduled_at: new Date().toISOString().slice(0, 16),
      duration_minutes: 30,
      status: "scheduled",
      notes: "",
    })
    setIsFormOpen(true)
  }

  function openEdit(m: Meeting) {
    setEditing(m)
    setForm({ ...m, scheduled_at: m.scheduled_at.slice(0, 16) })
    setIsFormOpen(true)
  }

  async function save() {
    if (!form.title || !form.scheduled_at) return toast.error("Título y fecha son requeridos")
    const payload = {
      ...form,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: Number(form.duration_minutes) || 30,
      updated_at: new Date().toISOString(),
    }
    if (editing) {
      const { error } = await db.from("meetings").update(payload).eq("id", editing.id)
      if (error) return toast.error("Error al actualizar")
      toast.success("Reunión actualizada")
    } else {
      const { error } = await db.from("meetings").insert(payload)
      if (error) return toast.error("Error al crear")
      toast.success("Reunión creada")
    }
    setIsFormOpen(false)
    fetchMeetings()
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await db.from("meetings").update({ status }).eq("id", id)
    if (error) return toast.error("Error")
    toast.success("Estado actualizado")
    fetchMeetings()
  }

  async function deleteMeeting(id: string) {
    if (!confirm("¿Eliminar reunión?")) return
    const { error } = await db.from("meetings").delete().eq("id", id)
    if (error) return toast.error("Error")
    toast.success("Eliminada")
    fetchMeetings()
  }

  const filtered = meetings.filter((m) => {
    const d = new Date(m.scheduled_at)
    if (filter === "upcoming") return isFuture(d) || isToday(d)
    if (filter === "today") return isToday(d)
    if (filter === "past") return isPast(d) && !isToday(d)
    return true
  })

  const stats = {
    today: meetings.filter((m) => isToday(new Date(m.scheduled_at))).length,
    upcoming: meetings.filter((m) => isFuture(new Date(m.scheduled_at))).length,
    completed: meetings.filter((m) => m.status === "completed").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agenda / Reuniones</h2>
          <p className="text-muted-foreground">Programa y gestiona reuniones con clientes</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nueva reunión
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-5"><div className="text-sm text-muted-foreground">Hoy</div><div className="mt-1 text-2xl font-bold">{stats.today}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="text-sm text-muted-foreground">Próximas</div><div className="mt-1 text-2xl font-bold">{stats.upcoming}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="text-sm text-muted-foreground">Realizadas</div><div className="mt-1 text-2xl font-bold">{stats.completed}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reuniones ({filtered.length})</CardTitle>
          <div className="flex gap-2">
            {(["upcoming", "today", "past", "all"] as const).map((k) => (
              <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
                {k === "upcoming" ? "Próximas" : k === "today" ? "Hoy" : k === "past" ? "Pasadas" : "Todas"}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <Calendar className="h-10 w-10" />
              <p className="mt-2 text-sm">Sin reuniones</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((m) => {
                const meta = statusMeta[m.status]
                const d = new Date(m.scheduled_at)
                return (
                  <li key={m.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="text-xs uppercase">{format(d, "MMM", { locale: es })}</span>
                      <span className="text-2xl font-bold leading-none">{format(d, "dd")}</span>
                      <span className="text-[10px] text-muted-foreground">{format(d, "HH:mm")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{m.title}</p>
                        <Badge className={meta.color}>{meta.label}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {m.duration_minutes} min
                        </span>
                      </div>
                      {m.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{m.description}</p>}
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {m.attendee_name && <span>{m.attendee_name}</span>}
                        {m.attendee_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {m.attendee_email}</span>}
                        {m.meeting_link && <a href={m.meeting_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Video className="h-3 w-3" /> Unirse</a>}
                        {m.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {m.location}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select value={m.status} onValueChange={(v) => updateStatus(m.id, v)}>
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusMeta).map(([k, meta]) => (
                            <SelectItem key={k} value={k}>{meta.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(m)}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMeeting(m.id)}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar reunión" : "Nueva reunión"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Descripción</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha y hora *</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Duración (min)</Label>
              <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nombre asistente</Label>
              <Input value={form.attendee_name} onChange={(e) => setForm({ ...form, attendee_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email asistente</Label>
              <Input value={form.attendee_email} onChange={(e) => setForm({ ...form, attendee_email: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Enlace (Meet / Zoom)</Label>
              <Input value={form.meeting_link} onChange={(e) => setForm({ ...form, meeting_link: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Ubicación (si es presencial)</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Notas</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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




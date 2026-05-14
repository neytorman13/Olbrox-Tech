"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Zap, Edit, Trash2, Play, Mail, MessageSquare, Bell, UserPlus, FileText } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Automation {
  id: string
  name: string
  description: string | null
  trigger_event: string
  trigger_config: Record<string, any>
  actions: { type: string; config: Record<string, any> }[]
  is_active: boolean
  runs_count: number
  last_run_at: string | null
  created_at: string
}

const triggerLabels: Record<string, string> = {
  lead_created: "Cuando llega un nuevo lead",
  form_submitted: "Cuando se envía un formulario",
  quote_sent: "Cuando se envía una cotización",
  quote_accepted: "Cuando se acepta una cotización",
  whatsapp_click: "Cuando clickean WhatsApp",
  email_received: "Cuando llega un correo",
  no_response: "Cuando no hay respuesta en X días",
  customer_converted: "Cuando un prospecto se convierte",
  manual: "Ejecución manual",
}

const actionLabels: Record<string, { label: string; icon: any }> = {
  send_email: { label: "Enviar email", icon: Mail },
  send_whatsapp: { label: "Enviar WhatsApp", icon: MessageSquare },
  notify_admin: { label: "Notificar al admin", icon: Bell },
  create_lead: { label: "Crear lead", icon: UserPlus },
  create_followup: { label: "Crear seguimiento", icon: FileText },
  update_status: { label: "Actualizar estado", icon: Zap },
}

export default function AutomationsPage() {
  const [items, setItems] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Automation | null>(null)
  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    trigger_event: "lead_created",
    trigger_config: {},
    actions: [{ type: "notify_admin", config: { message: "" } }],
    is_active: true,
  })
  const db = createClient()

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data, error } = await db.from("automations").select("*").order("created_at", { ascending: false })
    if (error) toast.error("Error al cargar automatizaciones")
    setItems(data || [])
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setForm({
      name: "",
      description: "",
      trigger_event: "lead_created",
      trigger_config: {},
      actions: [{ type: "notify_admin", config: { message: "" } }],
      is_active: true,
    })
    setIsFormOpen(true)
  }

  function openEdit(a: Automation) {
    setEditing(a)
    setForm({
      name: a.name,
      description: a.description || "",
      trigger_event: a.trigger_event,
      trigger_config: a.trigger_config || {},
      actions: a.actions || [],
      is_active: a.is_active,
    })
    setIsFormOpen(true)
  }

  async function save() {
    if (!form.name) return toast.error("Nombre requerido")
    const payload = { ...form, updated_at: new Date().toISOString() }
    if (editing) {
      const { error } = await db.from("automations").update(payload).eq("id", editing.id)
      if (error) return toast.error("Error")
      toast.success("Automatización actualizada")
    } else {
      const { error } = await db.from("automations").insert(payload)
      if (error) return toast.error("Error")
      toast.success("Automatización creada")
    }
    setIsFormOpen(false)
    fetchItems()
  }

  async function toggleActive(a: Automation) {
    const { error } = await db.from("automations").update({ is_active: !a.is_active }).eq("id", a.id)
    if (error) return toast.error("Error")
    fetchItems()
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar automatización?")) return
    const { error } = await db.from("automations").delete().eq("id", id)
    if (error) return toast.error("Error")
    toast.success("Eliminada")
    fetchItems()
  }

  function addAction() {
    setForm({ ...form, actions: [...form.actions, { type: "notify_admin", config: {} }] })
  }

  function removeAction(idx: number) {
    setForm({ ...form, actions: form.actions.filter((_: any, i: number) => i !== idx) })
  }

  function updateAction(idx: number, field: string, value: any) {
    const next = [...form.actions]
    if (field === "type") next[idx] = { type: value, config: {} }
    else next[idx].config = { ...next[idx].config, [field]: value }
    setForm({ ...form, actions: next })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automatizaciones</h2>
          <p className="text-muted-foreground">Reglas internas para ahorrar trabajo manual</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nueva regla</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
        ) : items.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
              <Zap className="h-10 w-10" />
              <p className="mt-2 text-sm">No hay automatizaciones</p>
              <p className="text-xs">Ejemplo: cuando llega un lead → crea seguimiento a 2 días</p>
            </CardContent>
          </Card>
        ) : (
          items.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base">{a.name}</CardTitle>
                    {a.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.description}</p>}
                  </div>
                  <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a)} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Se activa</p>
                  <p className="mt-1 text-sm">{triggerLabels[a.trigger_event]}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Acciones ({a.actions?.length || 0})</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(a.actions || []).map((act, i) => {
                      const meta = actionLabels[act.type]
                      if (!meta) return null
                      return (
                        <Badge key={i} variant="outline" className="gap-1">
                          <meta.icon className="h-3 w-3" /> {meta.label}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <p className="text-xs text-muted-foreground">
                    <Play className="mr-1 inline h-3 w-3" /> {a.runs_count} ejecuciones
                    {a.last_run_at && ` · Última: ${format(new Date(a.last_run_at), "dd MMM", { locale: es })}`}
                  </p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(a)}><Edit className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => remove(a.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar automatización" : "Nueva automatización"}</DialogTitle>
            <DialogDescription>Define un disparador y acciones a ejecutar</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Descripción</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Disparador (trigger)</Label>
                <Select value={form.trigger_event} onValueChange={(v) => setForm({ ...form, trigger_event: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(triggerLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Acciones a ejecutar</Label>
                <Button size="sm" variant="outline" onClick={addAction}>
                  <Plus className="mr-1 h-3 w-3" /> Agregar
                </Button>
              </div>
              <div className="space-y-2">
                {form.actions.map((act: any, idx: number) => (
                  <div key={idx} className="rounded-lg border p-3 space-y-2">
                    <div className="flex gap-2">
                      <Select value={act.type} onValueChange={(v) => updateAction(idx, "type", v)}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(actionLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" onClick={() => removeAction(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    {(act.type === "send_email" || act.type === "send_whatsapp" || act.type === "notify_admin") && (
                      <Textarea
                        placeholder="Mensaje (usa {{nombre}}, {{email}} como variables)"
                        rows={2}
                        value={act.config.message || ""}
                        onChange={(e) => updateAction(idx, "message", e.target.value)}
                      />
                    )}
                    {act.type === "create_followup" && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          placeholder="Título del seguimiento"
                          value={act.config.title || ""}
                          onChange={(e) => updateAction(idx, "title", e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Días de plazo"
                          value={act.config.days || ""}
                          onChange={(e) => updateAction(idx, "days", e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Activa</Label>
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



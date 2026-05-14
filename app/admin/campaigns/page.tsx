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
import { Progress } from "@/components/ui/progress"
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
import { Plus, Megaphone, Edit, Trash2, DollarSign, Target, TrendingUp } from "lucide-react"

interface Campaign {
  id: string
  name: string
  description: string | null
  channel: string
  budget: number
  spent: number
  leads_generated: number
  conversions: number
  revenue: number
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  starts_at: string | null
  ends_at: string | null
  status: string
}

const channelLabels: Record<string, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  social: "Redes sociales",
  ads: "Anuncios pagados",
  sms: "SMS",
  other: "Otro",
}
const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  active: "bg-emerald-500",
  paused: "bg-yellow-500",
  ended: "bg-blue-500",
}

export default function CampaignsPage() {
  const [items, setItems] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    channel: "email",
    budget: 0,
    spent: 0,
    leads_generated: 0,
    conversions: 0,
    revenue: 0,
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    status: "draft",
  })
  const db = createClient()

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data, error } = await db.from("campaigns").select("*").order("created_at", { ascending: false })
    if (error) toast.error("Error al cargar campañas")
    setItems(data || [])
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setForm({
      name: "",
      description: "",
      channel: "email",
      budget: 0,
      spent: 0,
      leads_generated: 0,
      conversions: 0,
      revenue: 0,
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      status: "draft",
    })
    setIsFormOpen(true)
  }

  function openEdit(c: Campaign) {
    setEditing(c)
    setForm(c)
    setIsFormOpen(true)
  }

  async function save() {
    if (!form.name) return toast.error("Nombre requerido")
    const payload = {
      ...form,
      budget: Number(form.budget) || 0,
      spent: Number(form.spent) || 0,
      leads_generated: Number(form.leads_generated) || 0,
      conversions: Number(form.conversions) || 0,
      revenue: Number(form.revenue) || 0,
      updated_at: new Date().toISOString(),
    }
    if (editing) {
      const { error } = await db.from("campaigns").update(payload).eq("id", editing.id)
      if (error) return toast.error("Error")
      toast.success("Campaña actualizada")
    } else {
      const { error } = await db.from("campaigns").insert(payload)
      if (error) return toast.error("Error")
      toast.success("Campaña creada")
    }
    setIsFormOpen(false)
    fetchItems()
  }

  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar campaña?")) return
    const { error } = await db.from("campaigns").delete().eq("id", id)
    if (error) return toast.error("Error")
    toast.success("Eliminada")
    fetchItems()
  }

  const totals = items.reduce(
    (acc, i) => ({
      budget: acc.budget + Number(i.budget),
      spent: acc.spent + Number(i.spent),
      leads: acc.leads + i.leads_generated,
      revenue: acc.revenue + Number(i.revenue),
    }),
    { budget: 0, spent: 0, leads: 0, revenue: 0 },
  )

  const roi = totals.spent > 0 ? ((totals.revenue - totals.spent) / totals.spent) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campañas</h2>
          <p className="text-muted-foreground">Marketing y promociones</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nueva campaña</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Presupuesto total</span><DollarSign className="h-4 w-4 text-muted-foreground" /></div><div className="mt-1 text-2xl font-bold">${totals.budget.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Gastado</span><DollarSign className="h-4 w-4 text-muted-foreground" /></div><div className="mt-1 text-2xl font-bold">${totals.spent.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Leads generados</span><Target className="h-4 w-4 text-muted-foreground" /></div><div className="mt-1 text-2xl font-bold">{totals.leads}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">ROI</span><TrendingUp className="h-4 w-4 text-muted-foreground" /></div><div className={`mt-1 text-2xl font-bold ${roi >= 0 ? "text-emerald-600" : "text-red-500"}`}>{roi.toFixed(1)}%</div></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
        ) : items.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
              <Megaphone className="h-10 w-10" />
              <p className="mt-2 text-sm">Sin campañas creadas</p>
            </CardContent>
          </Card>
        ) : (
          items.map((c) => {
            const pct = c.budget > 0 ? (Number(c.spent) / Number(c.budget)) * 100 : 0
            return (
              <Card key={c.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">{c.name}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">{channelLabels[c.channel]}</p>
                    </div>
                    <Badge className={statusColors[c.status]}>{c.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Presupuesto</span>
                      <span>${Number(c.spent).toLocaleString()} / ${Number(c.budget).toLocaleString()}</span>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="mt-1 h-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Leads</p>
                      <p className="font-semibold">{c.leads_generated}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Conv.</p>
                      <p className="font-semibold">{c.conversions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ingresos</p>
                      <p className="font-semibold">${Number(c.revenue).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 pt-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Edit className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => deleteItem(c.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar campaña" : "Nueva campaña"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Descripción</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(channelLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                  <SelectItem value="ended">Finalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Presupuesto (USD)</Label>
              <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Gastado (USD)</Label>
              <Input type="number" value={form.spent} onChange={(e) => setForm({ ...form, spent: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Leads generados</Label>
              <Input type="number" value={form.leads_generated} onChange={(e) => setForm({ ...form, leads_generated: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Conversiones</Label>
              <Input type="number" value={form.conversions} onChange={(e) => setForm({ ...form, conversions: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Ingresos generados (USD)</Label>
              <Input type="number" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>UTM Source</Label>
              <Input value={form.utm_source} onChange={(e) => setForm({ ...form, utm_source: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>UTM Medium</Label>
              <Input value={form.utm_medium} onChange={(e) => setForm({ ...form, utm_medium: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>UTM Campaign</Label>
              <Input value={form.utm_campaign} onChange={(e) => setForm({ ...form, utm_campaign: e.target.value })} />
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



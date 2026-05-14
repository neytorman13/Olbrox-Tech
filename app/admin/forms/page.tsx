"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Search, Inbox, CheckCircle2, AlertOctagon, Trash2, UserPlus, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface FormSubmission {
  id: string
  form_name: string
  page_path: string | null
  payload: Record<string, any>
  ip_address: string | null
  is_spam: boolean
  is_handled: boolean
  lead_id: string | null
  created_at: string
}

export default function FormsPage() {
  const [items, setItems] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("pending")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<FormSubmission | null>(null)
  const db = createClient()

  useEffect(() => {
    fetchItems()
  }, [filter])

  async function fetchItems() {
    setLoading(true)
    let query = db.from("form_submissions").select("*").order("created_at", { ascending: false })
    if (filter === "pending") query = query.eq("is_handled", false).eq("is_spam", false)
    if (filter === "handled") query = query.eq("is_handled", true)
    if (filter === "spam") query = query.eq("is_spam", true)
    const { data, error } = await query.limit(200)
    if (error) toast.error("Error al cargar envíos")
    setItems(data || [])
    setLoading(false)
  }

  async function toggleFlag(id: string, field: "is_handled" | "is_spam", value: boolean) {
    const { error } = await db.from("form_submissions").update({ [field]: value }).eq("id", id)
    if (error) return toast.error("Error")
    toast.success("Actualizado")
    fetchItems()
    if (selected?.id === id) setSelected({ ...selected, [field]: value } as any)
  }

  async function convertToLead(item: FormSubmission) {
    const p = item.payload || {}
    const { data, error } = await db
      .from("leads")
      .insert({
        full_name: p.name || p.full_name || p.nombre || "Sin nombre",
        email: p.email || p.correo || "sin@email.com",
        phone: p.phone || p.telefono || null,
        company: p.company || p.empresa || null,
        message: p.message || p.mensaje || null,
        source: `form:${item.form_name}`,
      })
      .select("id")
      .single()
    if (error) return toast.error("Error al convertir")
    await db.from("form_submissions").update({ lead_id: data.id, is_handled: true }).eq("id", item.id)
    toast.success("Lead creado desde formulario")
    fetchItems()
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este envío?")) return
    const { error } = await db.from("form_submissions").delete().eq("id", id)
    if (error) return toast.error("Error")
    toast.success("Eliminado")
    setSelected(null)
    fetchItems()
  }

  const filtered = items.filter((i) => {
    if (!search) return true
    const json = JSON.stringify(i.payload).toLowerCase()
    return (
      json.includes(search.toLowerCase()) ||
      i.form_name.toLowerCase().includes(search.toLowerCase())
    )
  })

  const stats = {
    total: items.length,
    pending: items.filter((i) => !i.is_handled && !i.is_spam).length,
    handled: items.filter((i) => i.is_handled).length,
    spam: items.filter((i) => i.is_spam).length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Formularios</h2>
        <p className="text-muted-foreground">Bandeja de solicitudes y envíos del sitio web</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="cursor-pointer" onClick={() => setFilter("all")}><CardContent className="pt-5"><div className="text-sm text-muted-foreground">Total</div><div className="mt-1 text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setFilter("pending")}><CardContent className="pt-5"><div className="text-sm text-muted-foreground">Pendientes</div><div className="mt-1 text-2xl font-bold text-orange-500">{stats.pending}</div></CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setFilter("handled")}><CardContent className="pt-5"><div className="text-sm text-muted-foreground">Gestionados</div><div className="mt-1 text-2xl font-bold text-emerald-600">{stats.handled}</div></CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setFilter("spam")}><CardContent className="pt-5"><div className="text-sm text-muted-foreground">Spam</div><div className="mt-1 text-2xl font-bold text-red-500">{stats.spam}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="lg:h-[65vh]">
          <CardHeader className="pb-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-10" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="handled">Gestionados</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[55vh]">
              {loading ? (
                <div className="space-y-2 p-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                  <Inbox className="h-10 w-10" />
                  <p className="mt-2 text-sm">Sin envíos</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {filtered.map((i) => {
                    const p = i.payload || {}
                    const name = p.name || p.full_name || p.nombre || "Anónimo"
                    return (
                      <li
                        key={i.id}
                        className={`cursor-pointer p-3 hover:bg-muted/50 ${selected?.id === i.id ? "bg-muted" : ""}`}
                        onClick={() => setSelected(i)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="truncate font-medium">{name}</p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(i.created_at), "dd MMM", { locale: es })}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{i.form_name}</Badge>
                          {i.is_handled && <Badge className="bg-emerald-500 text-[10px]">Gestionado</Badge>}
                          {i.is_spam && <Badge className="bg-red-500 text-[10px]">Spam</Badge>}
                          {i.lead_id && <Badge variant="secondary" className="text-[10px]">Lead</Badge>}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:h-[65vh]">
          {!selected ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Inbox className="h-12 w-12" />
              <p className="mt-2 text-sm">Selecciona un envío</p>
            </div>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-lg">{selected.form_name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(selected.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                  {selected.page_path && ` · ${selected.page_path}`}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {!selected.lead_id && (
                    <Button size="sm" onClick={() => convertToLead(selected)}>
                      <UserPlus className="mr-2 h-4 w-4" /> Convertir en lead
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => toggleFlag(selected.id, "is_handled", !selected.is_handled)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> {selected.is_handled ? "Marcar pendiente" : "Marcar gestionado"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleFlag(selected.id, "is_spam", !selected.is_spam)}>
                    <AlertOctagon className="mr-2 h-4 w-4" /> {selected.is_spam ? "No es spam" : "Marcar spam"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(selected.id)}>
                    <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Eliminar
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <ScrollArea className="h-[44vh]">
                  <div className="space-y-3 p-6">
                    {Object.entries(selected.payload || {}).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">{key}</p>
                        <p className="mt-1 break-words">{typeof value === "string" ? value : JSON.stringify(value)}</p>
                      </div>
                    ))}
                    {selected.ip_address && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">IP</p>
                        <p className="mt-1 font-mono text-xs">{selected.ip_address}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}



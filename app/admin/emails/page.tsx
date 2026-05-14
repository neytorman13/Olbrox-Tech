"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  Mail,
  MailOpen,
  Star,
  Reply,
  Archive,
  Trash2,
  Search,
  Inbox,
  Send,
  Link as LinkIcon,
  RefreshCcw,
  User,
  Plus,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Email {
  id: string
  from_name: string | null
  from_email: string
  to_email: string | null
  subject: string | null
  snippet: string | null
  body_text: string | null
  body_html: string | null
  is_read: boolean
  is_starred: boolean
  is_replied: boolean
  is_archived: boolean
  lead_id: string | null
  received_at: string
}

type Folder = "inbox" | "starred" | "replied" | "archived" | "pending"

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [folder, setFolder] = useState<Folder>("inbox")
  const [selected, setSelected] = useState<Email | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [manual, setManual] = useState({
    from_name: "",
    from_email: "",
    subject: "",
    body_text: "",
  })
  const db = createClient()

  useEffect(() => {
    fetchEmails()
  }, [folder])

  async function fetchEmails() {
    setLoading(true)
    let query = db.from("emails").select("*").order("received_at", { ascending: false })

    if (folder === "inbox") query = query.eq("is_archived", false)
    if (folder === "starred") query = query.eq("is_starred", true)
    if (folder === "replied") query = query.eq("is_replied", true)
    if (folder === "archived") query = query.eq("is_archived", true)
    if (folder === "pending") query = query.eq("is_replied", false).eq("is_archived", false)

    const { data, error } = await query.limit(200)
    if (error) toast.error("Error al cargar correos")
    setEmails(data || [])
    setLoading(false)
  }

  async function toggleFlag(email: Email, field: "is_read" | "is_starred" | "is_replied" | "is_archived") {
    const { error } = await db
      .from("emails")
      .update({ [field]: !email[field] })
      .eq("id", email.id)
    if (error) {
      toast.error("No se pudo actualizar")
      return
    }
    fetchEmails()
    if (selected?.id === email.id) setSelected({ ...email, [field]: !email[field] })
  }

  async function convertToLead(email: Email) {
    const { data, error } = await db
      .from("leads")
      .insert({
        full_name: email.from_name || email.from_email,
        email: email.from_email,
        message: email.snippet || email.subject,
        source: "gmail",
      })
      .select("id")
      .single()
    if (error) {
      toast.error("Error al convertir en lead")
      return
    }
    await db.from("emails").update({ lead_id: data.id }).eq("id", email.id)
    toast.success("Lead creado desde el correo")
    fetchEmails()
  }

  async function deleteEmail(id: string) {
    const { error } = await db.from("emails").delete().eq("id", id)
    if (error) return toast.error("Error al eliminar")
    toast.success("Correo eliminado")
    setSelected(null)
    fetchEmails()
  }

  async function addManualEmail() {
    if (!manual.from_email) return toast.error("Email del remitente es requerido")
    const { error } = await db.from("emails").insert({
      ...manual,
      snippet: manual.body_text.slice(0, 160),
    })
    if (error) return toast.error("Error al guardar")
    toast.success("Correo registrado")
    setManual({ from_name: "", from_email: "", subject: "", body_text: "" })
    setIsAddOpen(false)
    fetchEmails()
  }

  const filtered = emails.filter(
    (e) =>
      !search ||
      e.from_email.toLowerCase().includes(search.toLowerCase()) ||
      (e.subject || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.snippet || "").toLowerCase().includes(search.toLowerCase()),
  )

  const unread = emails.filter((e) => !e.is_read).length

  const folders: { key: Folder; label: string; icon: any; count?: number }[] = [
    { key: "inbox", label: "Bandeja de entrada", icon: Inbox, count: unread },
    { key: "pending", label: "Sin responder", icon: Mail },
    { key: "starred", label: "Destacados", icon: Star },
    { key: "replied", label: "Respondidos", icon: Reply },
    { key: "archived", label: "Archivados", icon: Archive },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Correos (Gmail)</h2>
          <p className="text-muted-foreground">Bandeja de entrada y gestión de contactos por email</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchEmails}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Actualizar
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Registrar correo
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr_1fr]">
        {/* Sidebar folders */}
        <Card className="lg:h-[70vh]">
          <CardContent className="p-3">
            <nav className="flex flex-col gap-1">
              {folders.map((f) => (
                <Button
                  key={f.key}
                  variant={folder === f.key ? "secondary" : "ghost"}
                  className="justify-start gap-3"
                  onClick={() => setFolder(f.key)}
                >
                  <f.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{f.label}</span>
                  {f.count ? <Badge variant="secondary">{f.count}</Badge> : null}
                </Button>
              ))}
            </nav>
            <Separator className="my-3" />
            <p className="px-3 text-xs text-muted-foreground">
              Conecta Gmail vía una integración (OAuth) para sincronizar automáticamente. Mientras tanto puedes registrar correos manualmente.
            </p>
          </CardContent>
        </Card>

        {/* Message list */}
        <Card className="lg:h-[70vh]">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Buscar correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[56vh]">
              {loading ? (
                <div className="space-y-2 p-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                  <Mail className="h-10 w-10" />
                  <p className="mt-2 text-sm">Sin correos</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {filtered.map((e) => (
                    <li
                      key={e.id}
                      className={`cursor-pointer p-3 transition-colors hover:bg-muted/50 ${
                        selected?.id === e.id ? "bg-muted" : ""
                      } ${!e.is_read ? "font-semibold" : ""}`}
                      onClick={() => {
                        setSelected(e)
                        if (!e.is_read) toggleFlag(e, "is_read")
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {!e.is_read ? (
                            <Mail className="h-4 w-4 shrink-0 text-primary" />
                          ) : (
                            <MailOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate text-sm">{e.from_name || e.from_email}</span>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {format(new Date(e.received_at), "dd MMM", { locale: es })}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm">{e.subject || "(sin asunto)"}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs font-normal text-muted-foreground">{e.snippet}</p>
                      <div className="mt-1 flex gap-1">
                        {e.is_starred && <Star className="h-3 w-3 text-yellow-500" />}
                        {e.is_replied && <Reply className="h-3 w-3 text-green-500" />}
                        {e.lead_id && <Badge variant="outline" className="h-4 px-1 text-[10px]">Lead</Badge>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message view */}
        <Card className="lg:h-[70vh]">
          {!selected ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Mail className="h-12 w-12" />
              <p className="mt-2 text-sm">Selecciona un correo</p>
            </div>
          ) : (
            <>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{selected.subject || "(sin asunto)"}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selected.from_name ? `${selected.from_name} <${selected.from_email}>` : selected.from_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(selected.received_at), "dd MMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => toggleFlag(selected, "is_starred")}>
                      <Star className={`h-4 w-4 ${selected.is_starred ? "fill-yellow-500 text-yellow-500" : ""}`} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => toggleFlag(selected, "is_replied")}>
                      <Reply className={`h-4 w-4 ${selected.is_replied ? "text-green-500" : ""}`} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => toggleFlag(selected, "is_archived")}>
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteEmail(selected.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={`mailto:${selected.from_email}`}>
                      <Send className="mr-2 h-4 w-4" /> Responder en Gmail
                    </a>
                  </Button>
                  {!selected.lead_id && (
                    <Button size="sm" variant="outline" onClick={() => convertToLead(selected)}>
                      <User className="mr-2 h-4 w-4" /> Convertir en lead
                    </Button>
                  )}
                  {selected.lead_id && (
                    <Badge variant="outline" className="gap-1">
                      <LinkIcon className="h-3 w-3" /> Vinculado a lead
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <ScrollArea className="h-[44vh]">
                  <div className="p-6">
                    {selected.body_html ? (
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selected.body_html }} />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{selected.body_text || selected.snippet || "(sin contenido)"}</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar correo manual</DialogTitle>
            <DialogDescription>Para registrar un correo recibido cuando aún no está conectado Gmail.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label>Nombre remitente</Label>
              <Input value={manual.from_name} onChange={(e) => setManual({ ...manual, from_name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Email remitente *</Label>
              <Input value={manual.from_email} onChange={(e) => setManual({ ...manual, from_email: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Asunto</Label>
              <Input value={manual.subject} onChange={(e) => setManual({ ...manual, subject: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Contenido</Label>
              <Textarea
                rows={5}
                value={manual.body_text}
                onChange={(e) => setManual({ ...manual, body_text: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
            <Button onClick={addManualEmail}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



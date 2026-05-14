"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Mail,
  Phone,
  Building,
  Calendar,
  Filter,
  Download,
  Plus,
  FileText,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface Lead {
  id: string
  full_name: string
  email: string
  phone: string | null
  company: string | null
  message: string | null
  source: string
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

const statusOptions = [
  { value: "new", label: "Nuevo", color: "bg-blue-500" },
  { value: "contacted", label: "Contactado", color: "bg-yellow-500" },
  { value: "qualified", label: "Calificado", color: "bg-green-500" },
  { value: "proposal", label: "Propuesta", color: "bg-purple-500" },
  { value: "won", label: "Ganado", color: "bg-emerald-500" },
  { value: "lost", label: "Perdido", color: "bg-red-500" },
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newLead, setNewLead] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
    source: "manual",
  })
  const db = createClient()

  useEffect(() => {
    fetchLeads()
  }, [statusFilter])

  async function fetchLeads() {
    setLoading(true)
    let query = db
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    const { data, error } = await query

    if (error) {
      toast.error("Error al cargar los leads")
      console.error(error)
    } else {
      setLeads(data || [])
    }
    setLoading(false)
  }

  async function updateLeadStatus(id: string, status: string) {
    const { error } = await db
      .from("leads")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      toast.error("Error al actualizar el estado")
    } else {
      toast.success("Estado actualizado")
      fetchLeads()
    }
  }

  async function updateLeadNotes(id: string, notes: string) {
    const { error } = await db
      .from("leads")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      toast.error("Error al guardar las notas")
    } else {
      toast.success("Notas guardadas")
      setSelectedLead((prev) => prev ? { ...prev, notes } : null)
    }
  }

  async function deleteLead(id: string) {
    const { error } = await db.from("leads").delete().eq("id", id)

    if (error) {
      toast.error("Error al eliminar el lead")
    } else {
      toast.success("Lead eliminado")
      setIsDeleteDialogOpen(false)
      setSelectedLead(null)
      fetchLeads()
    }
  }

  async function createLead() {
    if (!newLead.full_name || !newLead.email) {
      toast.error("Nombre y email son requeridos")
      return
    }

    const { error } = await db.from("leads").insert([newLead])

    if (error) {
      toast.error("Error al crear el lead")
    } else {
      toast.success("Lead creado exitosamente")
      setIsAddDialogOpen(false)
      setNewLead({
        full_name: "",
        email: "",
        phone: "",
        company: "",
        message: "",
        source: "manual",
      })
      fetchLeads()
    }
  }

  function exportToCSV() {
    const headers = ["Nombre", "Email", "Teléfono", "Empresa", "Estado", "Fuente", "Fecha"]
    const rows = leads.map((lead) => [
      lead.full_name,
      lead.email,
      lead.phone || "",
      lead.company || "",
      statusOptions.find((s) => s.value === lead.status)?.label || lead.status,
      lead.source,
      format(new Date(lead.created_at), "dd/MM/yyyy HH:mm"),
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `leads_${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
    toast.success("Archivo CSV descargado")
  }

  const filteredLeads = leads.filter(
    (lead) =>
      lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find((s) => s.value === status)
    return (
      <Badge className={option?.color || "bg-gray-500"}>
        {option?.label || status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Leads</h2>
          <p className="text-muted-foreground">
            Administra los contactos y prospectos de tu negocio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {statusOptions.map((status) => {
          const count = leads.filter((l) => l.status === status.value).length
          return (
            <Card key={status.value} className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter(status.value)}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{status.label}</span>
                  <div className={`h-2 w-2 rounded-full ${status.color}`} />
                </div>
                <div className="text-2xl font-bold mt-1">{count}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No hay leads</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "No se encontraron leads con los filtros aplicados"
                  : "Aún no tienes leads registrados"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.full_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{lead.email}</span>
                          {lead.phone && (
                            <span className="text-xs text-muted-foreground">{lead.phone}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{lead.company || "-"}</TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(value) => updateLeadStatus(lead.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.source}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(lead.created_at), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedLead(lead)
                                setIsViewDialogOpen(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/quotations/new?lead=${lead.id}`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Crear cotización
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${lead.email}`}>
                                <Mail className="mr-2 h-4 w-4" />
                                Enviar email
                              </a>
                            </DropdownMenuItem>
                            {lead.phone && (
                              <DropdownMenuItem asChild>
                                <a href={`tel:${lead.phone}`}>
                                  <Phone className="mr-2 h-4 w-4" />
                                  Llamar
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedLead(lead)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Lead Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Lead</DialogTitle>
            <DialogDescription>
              Información completa del contacto
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{selectedLead.full_name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Estado</Label>
                  <div>{getStatusBadge(selectedLead.status)}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </Label>
                  <p>{selectedLead.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Teléfono
                  </Label>
                  <p>{selectedLead.phone || "No proporcionado"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Building className="h-4 w-4" /> Empresa
                  </Label>
                  <p>{selectedLead.company || "No proporcionado"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Fecha de registro
                  </Label>
                  <p>{format(new Date(selectedLead.created_at), "dd MMMM yyyy, HH:mm", { locale: es })}</p>
                </div>
              </div>

              {selectedLead.message && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Mensaje</Label>
                  <p className="rounded-lg bg-muted p-4">{selectedLead.message}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-muted-foreground">Notas internas</Label>
                <Textarea
                  placeholder="Agregar notas sobre este lead..."
                  value={selectedLead.notes || ""}
                  onChange={(e) =>
                    setSelectedLead({ ...selectedLead, notes: e.target.value })
                  }
                  rows={4}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateLeadNotes(selectedLead.id, selectedLead.notes || "")}
                >
                  Guardar notas
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Lead</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a {selectedLead?.full_name}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedLead && deleteLead(selectedLead.id)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lead Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Lead</DialogTitle>
            <DialogDescription>
              Agregar un nuevo contacto manualmente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo *</Label>
              <Input
                id="full_name"
                value={newLead.full_name}
                onChange={(e) => setNewLead({ ...newLead, full_name: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                placeholder="juan@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                placeholder="+593 99 999 9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={newLead.company}
                onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                placeholder="Nombre de la empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje / Notas</Label>
              <Textarea
                id="message"
                value={newLead.message}
                onChange={(e) => setNewLead({ ...newLead, message: e.target.value })}
                placeholder="Información adicional..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createLead}>
              Crear Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



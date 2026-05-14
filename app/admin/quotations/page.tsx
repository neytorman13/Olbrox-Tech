"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Send,
  Download,
  Trash2,
  Filter,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface Quotation {
  id: string
  quote_number: string
  client_name: string
  client_email: string
  client_company: string | null
  project_title: string
  total: number
  currency: string
  status: string
  valid_until: string | null
  created_at: string
}

const statusOptions = [
  { value: "draft", label: "Borrador", color: "bg-gray-500", icon: FileText },
  { value: "sent", label: "Enviada", color: "bg-blue-500", icon: Send },
  { value: "viewed", label: "Vista", color: "bg-yellow-500", icon: Eye },
  { value: "accepted", label: "Aceptada", color: "bg-green-500", icon: CheckCircle },
  { value: "rejected", label: "Rechazada", color: "bg-red-500", icon: XCircle },
  { value: "expired", label: "Expirada", color: "bg-gray-400", icon: Clock },
]

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const db = createClient()

  useEffect(() => {
    fetchQuotations()
  }, [statusFilter])

  async function fetchQuotations() {
    setLoading(true)
    let query = db
      .from("quotations")
      .select("*")
      .order("created_at", { ascending: false })

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    const { data, error } = await query

    if (error) {
      toast.error("Error al cargar las cotizaciones")
    } else {
      setQuotations(data || [])
    }
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await db
      .from("quotations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      toast.error("Error al actualizar el estado")
    } else {
      toast.success("Estado actualizado")
      fetchQuotations()
    }
  }

  async function deleteQuotation(id: string) {
    const { error } = await db.from("quotations").delete().eq("id", id)

    if (error) {
      toast.error("Error al eliminar la cotización")
    } else {
      toast.success("Cotización eliminada")
      fetchQuotations()
    }
  }

  const filteredQuotations = quotations.filter(
    (q) =>
      q.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.project_title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate stats
  const totalRevenue = quotations
    .filter((q) => q.status === "accepted")
    .reduce((sum, q) => sum + Number(q.total), 0)

  const pendingCount = quotations.filter((q) => ["draft", "sent", "viewed"].includes(q.status)).length
  const acceptedCount = quotations.filter((q) => q.status === "accepted").length

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
          <h2 className="text-2xl font-bold">Cotizaciones</h2>
          <p className="text-muted-foreground">
            Gestiona las propuestas y cotizaciones de tus clientes
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/quotations/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cotización
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">De cotizaciones aceptadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Cotizaciones en proceso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aceptadas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedCount}</div>
            <p className="text-xs text-muted-foreground">Proyectos ganados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, número o proyecto..."
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

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotizaciones ({filteredQuotations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No hay cotizaciones</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primera cotización para empezar
              </p>
              <Button asChild>
                <Link href="/admin/quotations/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Cotización
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-mono font-medium">
                        {quotation.quote_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{quotation.client_name}</p>
                          <p className="text-sm text-muted-foreground">{quotation.client_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {quotation.project_title}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${Number(quotation.total).toLocaleString()} {quotation.currency}
                      </TableCell>
                      <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(quotation.created_at), "dd MMM yyyy", { locale: es })}
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
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/quotations/${quotation.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalles
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(quotation.id, "sent")}>
                              <Send className="mr-2 h-4 w-4" />
                              Marcar como enviada
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(quotation.id, "accepted")}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Marcar como aceptada
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteQuotation(quotation.id)}
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
    </div>
  )
}



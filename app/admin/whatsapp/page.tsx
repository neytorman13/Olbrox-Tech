"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import {
  MessageSquare,
  Phone,
  ExternalLink,
  MoreVertical,
  Eye,
  UserPlus,
  TrendingUp,
  MousePointerClick,
  Globe,
  Calendar,
  Filter,
  Search,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface WhatsAppConversation {
  id: string
  lead_id: string | null
  phone_number: string
  contact_name: string | null
  initial_message: string | null
  source_page: string | null
  source_button: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

interface ChartData {
  date: string
  clicks: number
}

const STATUS_OPTIONS = [
  { value: "initiated", label: "Iniciado", color: "bg-blue-500" },
  { value: "responded", label: "Respondido", color: "bg-yellow-500" },
  { value: "converted", label: "Convertido", color: "bg-green-500" },
  { value: "closed", label: "Cerrado", color: "bg-gray-500" },
]

export default function WhatsAppPage() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    converted: 0,
    conversionRate: 0,
  })
  const db = createClient()

  const fetchData = useCallback(async () => {
    try {
      // Fetch conversations
      let query = db
        .from("whatsapp_conversations")
        .select("*")
        .order("created_at", { ascending: false })

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setConversations(data || [])

      // Calculate stats
      const today = new Date()
      const todayStart = startOfDay(today)
      const totalConversations = data?.length || 0
      const todayConversations = data?.filter(
        (c: any) => new Date(c.created_at) >= todayStart
      ).length || 0
      const convertedConversations = data?.filter((c: any) => c.status === "converted").length || 0

      setStats({
        total: totalConversations,
        today: todayConversations,
        converted: convertedConversations,
        conversionRate: totalConversations > 0
          ? Math.round((convertedConversations / totalConversations) * 100)
          : 0,
      })

      // Generate chart data (last 14 days)
      const chartDataArray: ChartData[] = []
      for (let i = 13; i >= 0; i--) {
        const date = subDays(today, i)
        const dayStart = startOfDay(date)
        const dayEnd = endOfDay(date)
        const count = data?.filter((c: any) => {
          const createdAt = new Date(c.created_at)
          return createdAt >= dayStart && createdAt <= dayEnd
        }).length || 0

        chartDataArray.push({
          date: format(date, "dd MMM", { locale: es }),
          clicks: count,
        })
      }
      setChartData(chartDataArray)
    } catch (error) {
      console.error("Error fetching WhatsApp data:", error)
      toast.error("Error al cargar datos de WhatsApp")
    } finally {
      setLoading(false)
    }
  }, [db, filterStatus])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function updateStatus(id: string, status: string) {
    try {
      const { error } = await db
        .from("whatsapp_conversations")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
      toast.success("Estado actualizado")
      fetchData()
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Error al actualizar estado")
    }
  }

  async function updateNotes(id: string, notes: string) {
    try {
      const { error } = await db
        .from("whatsapp_conversations")
        .update({ notes, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
      toast.success("Notas guardadas")
    } catch (error) {
      console.error("Error updating notes:", error)
      toast.error("Error al guardar notas")
    }
  }

  async function convertToLead(conversation: WhatsAppConversation) {
    try {
      // Create lead from conversation
      const { data: lead, error: leadError } = await db
        .from("leads")
        .insert({
          full_name: conversation.contact_name || "WhatsApp Contact",
          email: "",
          phone: conversation.phone_number,
          source: "whatsapp",
          message: conversation.initial_message,
          status: "new",
        })
        .select()
        .single()

      if (leadError) throw leadError

      // Update conversation with lead_id
      const { error: updateError } = await db
        .from("whatsapp_conversations")
        .update({
          lead_id: lead.id,
          status: "converted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversation.id)

      if (updateError) throw updateError

      toast.success("Contacto convertido a lead")
      setIsDetailOpen(false)
      fetchData()
    } catch (error) {
      console.error("Error converting to lead:", error)
      toast.error("Error al convertir a lead")
    }
  }

  const filteredConversations = conversations.filter(
    (c) =>
      c.phone_number.includes(searchQuery) ||
      c.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.source_page?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function getStatusBadge(status: string) {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status)
    return (
      <Badge className={statusOption?.color || "bg-gray-500"}>
        {statusOption?.label || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">WhatsApp</h2>
          <p className="text-muted-foreground">
            Monitorea los clics y conversaciones iniciadas por WhatsApp
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clics
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Convertidos
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.converted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa Conversión
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Clics (Últimos 14 días)</CardTitle>
          <CardDescription>Tendencia de clics en el botón de WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#25D366"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClicks)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por teléfono o página..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Conversations Table */}
      <Card>
        <CardContent className="p-0">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Sin conversaciones</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Los clics en el botón de WhatsApp aparecerán aquí
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Campaña</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.map((conversation) => (
                  <TableRow
                    key={conversation.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedConversation(conversation)
                      setIsDetailOpen(true)
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{conversation.phone_number}</span>
                        {conversation.contact_name && (
                          <span className="text-muted-foreground">
                            ({conversation.contact_name})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{conversation.source_page || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {conversation.utm_campaign ? (
                        <Badge variant="outline">{conversation.utm_campaign}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(conversation.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(conversation.created_at), "dd MMM yyyy HH:mm", {
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedConversation(conversation)
                              setIsDetailOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(
                                `https://wa.me/${conversation.phone_number}`,
                                "_blank"
                              )
                            }}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir en WhatsApp
                          </DropdownMenuItem>
                          {!conversation.lead_id && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                convertToLead(conversation)
                              }}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Convertir a Lead
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              Detalles de Conversación
            </DialogTitle>
            <DialogDescription>
              Información del clic en WhatsApp
            </DialogDescription>
          </DialogHeader>
          {selectedConversation && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Teléfono</Label>
                  <p className="font-medium">{selectedConversation.phone_number}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="font-medium">
                    {selectedConversation.contact_name || "No especificado"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Página de Origen</Label>
                  <p className="font-medium">{selectedConversation.source_page || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Botón</Label>
                  <p className="font-medium">{selectedConversation.source_button || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Fecha</Label>
                  <p className="font-medium">
                    {format(new Date(selectedConversation.created_at), "dd MMM yyyy HH:mm", {
                      locale: es,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Estado</Label>
                  <Select
                    value={selectedConversation.status}
                    onValueChange={(value) => updateStatus(selectedConversation.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(selectedConversation.utm_source ||
                selectedConversation.utm_medium ||
                selectedConversation.utm_campaign) && (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium">Parámetros UTM</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedConversation.utm_source && (
                      <Badge variant="outline">source: {selectedConversation.utm_source}</Badge>
                    )}
                    {selectedConversation.utm_medium && (
                      <Badge variant="outline">medium: {selectedConversation.utm_medium}</Badge>
                    )}
                    {selectedConversation.utm_campaign && (
                      <Badge variant="outline">
                        campaign: {selectedConversation.utm_campaign}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  defaultValue={selectedConversation.notes || ""}
                  onBlur={(e) => updateNotes(selectedConversation.id, e.target.value)}
                  placeholder="Agregar notas sobre esta conversación..."
                  rows={3}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `https://wa.me/${selectedConversation.phone_number}`,
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir en WhatsApp
                </Button>
                {!selectedConversation.lead_id && (
                  <Button onClick={() => convertToLead(selectedConversation)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Convertir a Lead
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}



